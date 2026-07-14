import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import * as d3 from 'd3';
import {
  Landmark,
  Building2,
  Warehouse,
  Factory,
  School,
  Library,
  Plus,
  Minus,
  RotateCcw,
  X,
  Users,
  MapPinned,
  Ruler,
  Compass,
  Loader2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { fetchWithFallback, unwrap } from '@/lib/apiClient';
import { mapDummyData } from './mapdummydata';

/* ============================================================== */
/*  TYPES                                                          */
/* ============================================================== */

type IconName = 'Landmark' | 'Building2' | 'Warehouse' | 'Factory' | 'School' | 'Library';
type CardSide = 'left' | 'right';
type HexCategory =
  | 'Base'
  | 'Hotspot'
  | 'High density'
  | 'Medium density'
  | 'Low density'
  | 'Sparse activity';

/** Raw shape expected from GET /api/dashboard/map */
export interface ApiLocation {
  id?: string;
  name?: string;
  value?: number;
  lat: number;
  lon: number;
  color?: string;
  icon?: IconName | string;
  cardSide?: CardSide;
}

export interface DashboardMapResponse {
  newUsers?: number;
  label?: string;
  footerLabel?: string;
  locations: ApiLocation[];
}

/** Location after normalization + projection onto the map */
interface MapLocation {
  id: string;
  name: string;
  value: number;
  lat: number;
  lon: number;
  color: string;
  icon: IconName;
  cardSide: CardSide;
  xPct: number;
  yPct: number;
  x: number;
  y: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface HexCenter extends Point2D {
  id: number;
  region: string;
}

interface HexTile extends HexCenter {
  fill: string;
  opacity: number;
  isSelectedRing: boolean;
  category: HexCategory;
  nearest: MapLocation | null;
  nearestDist: number;
}

interface ZoomTransform {
  k: number;
  x: number;
  y: number;
}

type FetchStatus = 'loading' | 'ready' | 'error';

export interface HexWorldMapProps {
  /** Endpoint returning a DashboardMapResponse */
  apiUrl?: string;
  /** Hex tile radius in map units (smaller = denser grid) */
  hexRadius?: number;
}

/* ============================================================== */
/*  CONFIG                                                         */
/* ============================================================== */

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 650;
const DEFAULT_HEX_RADIUS = 9;
const DEFAULT_API_URL = '/api/dashboard/map';

const PALETTE = {
  bg: '#eef0fb',
  hexBase: '#ffffff',
  hexTexture: '#c3c2ef',
  hexMid: '#9491e8',
  hexMagenta: '#cf62db',
  hexHot: '#e2494e',
  text: '#2b2e63',
  subtext: '#8888ab',
} as const;

const ICONS: Record<IconName, LucideIcon> = { Landmark, Building2, Warehouse, Factory, School, Library };
const FALLBACK_COLORS = ['#4fa4e0', '#4fbf8b', '#cf7fdb', '#ee7c68', '#f2a458', '#5a8fe0'];

// Stylised landmasses (not real borders) — just enough silhouette for a
// world-map read. Coordinates live directly in the 1200x650 viewBox.
const CONTINENTS: { name: string; points: [number, number][] }[] = [
  { name: 'India', points: [
    [412,78], [456,48], [504,66], [548,52], [602,74], [654,108], [716,136], [772,178],
    [822,184], [854,214], [844,250], [810,260], [800,284], [774,292], [754,324],
    [720,342], [692,378], [674,422], [648,466], [628,518], [610,574], [584,612],
    [560,574], [520,522], [488,482], [470,440], [410,394], [426,354], [428,316],
    [402,290], [376,276], [348,258], [360,228], [382,206], [374,178], [396,152],
    [382,126], [404,102],
  ] },
];

const INDIA_BOUNDS = { minLat: 6, maxLat: 38, minLon: 67, maxLon: 99 } as const;
const INDIA_MAP_FRAME = { left: 340, top: 38, width: 530, height: 580 } as const;

/* ============================================================== */
/*  GEOMETRY HELPERS                                               */
/* ============================================================== */

function pointInPolygon([x, y]: [number, number], vs: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const [xi, yi] = vs[i];
    const [xj, yj] = vs[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function landRegion(pt: [number, number]): string | null {
  return CONTINENTS.find((c) => pointInPolygon(pt, c.points))?.name ?? null;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function generateHexCenters(width: number, height: number, r: number): HexCenter[] {
  const hexW = Math.sqrt(3) * r;
  const vertSpacing = 1.5 * r;
  const centers: HexCenter[] = [];
  let row = 0;
  let id = 0;
  for (let y = r; y < height + r; y += vertSpacing) {
    const xOffset = row % 2 === 0 ? 0 : hexW / 2;
    for (let x = r; x < width + r; x += hexW) {
      const px = x + xOffset;
      const region = landRegion([px, y]);
      if (region) centers.push({ id: id++, x: px, y, region });
    }
    row++;
  }
  return centers;
}

function hexPath(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)} `;
  }
  return d + 'Z';
}

// real lat/lon -> equirectangular % position on the map
function latLonToPct(lat: number, lon: number): { xPct: number; yPct: number } {
  const x = INDIA_MAP_FRAME.left
    + ((lon - INDIA_BOUNDS.minLon) / (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon)) * INDIA_MAP_FRAME.width;
  const y = INDIA_MAP_FRAME.top
    + ((INDIA_BOUNDS.maxLat - lat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * INDIA_MAP_FRAME.height;
  return { xPct: (x / MAP_WIDTH) * 100, yPct: (y / MAP_HEIGHT) * 100 };
}

// map-space x/y -> a cosmetic lat/lon readout for the tile popup
function xyToLatLon(x: number, y: number): { lat: number; lon: number } {
  return {
    lon: INDIA_BOUNDS.minLon + ((x - INDIA_MAP_FRAME.left) / INDIA_MAP_FRAME.width) * (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon),
    lat: INDIA_BOUNDS.maxLat - ((y - INDIA_MAP_FRAME.top) / INDIA_MAP_FRAME.height) * (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat),
  };
}

/* ============================================================== */
/*  FORMAT / COLOR HELPERS                                         */
/* ============================================================== */

function formatNumber(n: number | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

function categoryColor(hex: HexTile | null): string {
  if (!hex) return PALETTE.subtext;
  if (hex.category === 'Hotspot' && hex.nearest) return hex.nearest.color;
  if (hex.category === 'High density') return PALETTE.hexHot;
  if (hex.category === 'Medium density') return PALETTE.hexMid;
  if (hex.category === 'Low density' || hex.category === 'Sparse activity') return PALETTE.hexTexture;
  return PALETTE.subtext;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

/* ============================================================== */
/*  DATA NORMALIZATION                                             */
/*  Turns whatever /api/dashboard/map returns into safe map points */
/* ============================================================== */

function isIconName(v: unknown): v is IconName {
  return typeof v === 'string' && v in ICONS;
}

function normalizeLocations(raw: ApiLocation[] | undefined): MapLocation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((loc): loc is ApiLocation => typeof loc?.lat === 'number' && typeof loc?.lon === 'number')
    .map((loc, i) => {
      const { xPct, yPct } = latLonToPct(loc.lat, loc.lon);
      return {
        id: loc.id ?? `loc-${i}`,
        name: loc.name ?? 'Unknown',
        value: Number(loc.value) || 0,
        lat: loc.lat,
        lon: loc.lon,
        color: loc.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        icon: isIconName(loc.icon) ? loc.icon : 'Building2',
        cardSide: loc.cardSide === 'left' || loc.cardSide === 'right' ? loc.cardSide : xPct > 60 ? 'left' : 'right',
        xPct,
        yPct,
        x: (xPct / 100) * MAP_WIDTH,
        y: (yPct / 100) * MAP_HEIGHT,
      };
    });
}

/* ============================================================== */
/*  SMALL PRESENTATIONAL STATES                                    */
/* ============================================================== */

function LoadingState() {
  return (
    <div
      className="w-full rounded-3xl flex flex-col items-center justify-center gap-2"
      style={{ background: PALETTE.bg, aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
    >
      <Loader2 size={22} className="animate-spin" color={PALETTE.subtext} />
      <span className="text-sm font-medium" style={{ color: PALETTE.subtext }}>
        Loading map data…
      </span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="w-full rounded-3xl flex flex-col items-center justify-center gap-3"
      style={{ background: PALETTE.bg, aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
    >
      <AlertTriangle size={22} color={PALETTE.hexHot} />
      <span className="text-sm font-medium text-center px-6" style={{ color: PALETTE.text }}>
        Couldn't load map data{message ? `: ${message}` : ''}
      </span>
      <button
        onClick={onRetry}
        className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{ background: PALETTE.text }}
      >
        Retry
      </button>
    </div>
  );
}

/* ============================================================== */
/*  MAIN COMPONENT                                                 */
/* ============================================================== */

export default function HexWorldMap({
  apiUrl = DEFAULT_API_URL,
  hexRadius = DEFAULT_HEX_RADIUS,
}: HexWorldMapProps) {
  /* ---- data fetching ---- */
  const [status, setStatus] = useState<FetchStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [newUsers, setNewUsers] = useState(0);
  const [footerLabel, setFooterLabel] = useState('');

  const loadData = useCallback(() => {
    setStatus('loading');
    fetchWithFallback(apiUrl)
      .then((res) => unwrap<DashboardMapResponse>(res))
      .then((json) => {
        setLocations(normalizeLocations(json.locations));
        setNewUsers(json.newUsers ?? 0);
        setFooterLabel(json.label ?? json.footerLabel ?? '');
        setStatus('ready');
      })
      .catch((err: Error) => {
        // Keep the map usable when the API is unavailable during local UI work.
        setLocations(normalizeLocations(mapDummyData.locations));
        setNewUsers(mapDummyData.newUsers ?? 0);
        setFooterLabel(mapDummyData.label ?? '');
        setErrorMsg(err.message || 'Failed to load map data');
        setStatus('ready');
      });
  }, [apiUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- refs ---- */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  /* ---- interaction state ---- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexTile | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>({ k: 1, x: 0, y: 0 });

  const maxValue = useMemo(
    () => (locations.length ? Math.max(...locations.map((p) => p.value)) : 1),
    [locations]
  );

  const hexCenters = useMemo(
    () => generateHexCenters(MAP_WIDTH, MAP_HEIGHT, hexRadius),
    [hexRadius]
  );

  const hexData: HexTile[] = useMemo(() => {
    return hexCenters.map((hc) => {
      let nearest: MapLocation | null = null;
      let nearestDist = Infinity;

      for (const p of locations) {
        const weight = 0.4 + 0.6 * (p.value / maxValue);
        const dist = Math.hypot(hc.x - p.x, hc.y - p.y) / weight;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = p;
        }
      }

      let fill: string = PALETTE.hexBase;
      let opacity = 1;
      let category: HexCategory = 'Base';

      if (nearest) {
        if (nearestDist < 16) {
          fill = nearest.color;
          category = 'Hotspot';
        } else if (nearestDist < 30) {
          fill = PALETTE.hexHot;
          opacity = 0.85;
          category = 'High density';
        } else if (nearestDist < 55) {
          fill = PALETTE.hexMid;
          opacity = 0.55;
          category = 'Medium density';
        } else if (nearestDist < 90) {
          fill = PALETTE.hexTexture;
          opacity = 0.35;
          category = 'Low density';
        }
      }

      const noise = seededRandom(hc.id);
      if (fill === PALETTE.hexBase) {
        if (noise < 0.05) {
          fill = PALETTE.hexMagenta;
          opacity = 0.5;
          category = 'Sparse activity';
        } else if (noise < 0.16) {
          fill = PALETTE.hexTexture;
          opacity = 0.35;
          category = 'Sparse activity';
        }
      }

      const isSelectedRing = Boolean(selectedId && nearest?.id === selectedId && nearestDist < 20);

      return {
        ...hc,
        fill,
        opacity,
        isSelectedRing,
        category,
        nearest,
        nearestDist: Math.round(nearestDist),
      };
    });
  }, [hexCenters, locations, maxValue, selectedId]);

  /* ---- D3 enter/update/exit render of hex tiles ---- */
  useLayoutEffect(() => {
    if (!gRef.current) return;
    const g = d3.select(gRef.current);

    g.selectAll<SVGPathElement, HexTile>('path.hex')
      .data(hexData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'hex')
            .attr('d', (d) => hexPath(d.x, d.y, hexRadius * 0.92))
            .attr('fill', (d) => d.fill)
            .attr('opacity', 0)
            .attr('stroke', (d) => (d.isSelectedRing ? PALETTE.text : 'none'))
            .attr('stroke-width', (d) => (d.isSelectedRing ? 1.5 : 0))
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
              event.stopPropagation();
              setSelectedHex(d);
            })
            .call((enter) => enter.transition().duration(500).attr('opacity', (d) => d.opacity)),
        (update) =>
          update
            .attr('stroke', (d) => (d.isSelectedRing ? PALETTE.text : 'none'))
            .attr('stroke-width', (d) => (d.isSelectedRing ? 1.5 : 0))
            .call((update) =>
              update.transition().duration(400).attr('fill', (d) => d.fill).attr('opacity', (d) => d.opacity)
            ),
        (exit) => exit.call((exit) => exit.transition().duration(300).attr('opacity', 0).remove())
      );
  }, [hexData, hexRadius]);

  /* ---- zoom / pan ---- */
  useEffect(() => {
    if (!svgRef.current) return;
    const svgSel = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
      .on('zoom', (event) => setTransform(event.transform));
    zoomBehaviorRef.current = zoom;
    svgSel.call(zoom);
    return () => {
      svgSel.on('.zoom', null);
    };
  }, []);

  const zoomBy = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const resetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    setSelectedHex(null);
    setSelectedId(null);
  };

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={errorMsg} onRetry={loadData} />;

  const groupTransform = `translate(${transform.x},${transform.y}) scale(${transform.k})`;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{ background: PALETTE.bg, aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full block"
        onClick={() => setSelectedHex(null)}
      >
        <g transform={groupTransform}>
          <g ref={gRef} />

          {locations.map((p) => {
            const Icon = ICONS[p.icon] || Building2;
            const isSelected = selectedId === p.id;
            const isExpanded = hoveredId === p.id || isSelected;
            const cardW = 168;
            const cardH = 52;
            const dotSize = 36;
            const fx = p.cardSide === 'left' ? p.x - cardW - 8 : p.x + 8;
            const fy = p.y - cardH / 2;
            const dotLeft = p.cardSide === 'left' ? cardW - dotSize : 0;

            return (
              <foreignObject key={p.id} x={fx} y={fy} width={cardW} height={cardH} overflow="visible" style={{ overflow: 'visible' }}>
                <div
                  className="relative"
                  style={{ width: cardW, height: cardH }}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {!isExpanded && (
                    <span
                      className="absolute rounded-full animate-ping"
                      style={{
                        left: dotLeft,
                        top: (cardH - dotSize) / 2,
                        width: dotSize,
                        height: dotSize,
                        background: p.color,
                        opacity: 0.35,
                      }}
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(isSelected ? null : p.id);
                      setSelectedHex(null);
                    }}
                    className="absolute flex items-center gap-2 rounded-2xl bg-white/95 shadow-[0_6px_18px_rgba(60,60,120,0.2)] transition-all duration-200 ease-out overflow-hidden"
                    style={{
                      left: isExpanded ? 0 : dotLeft,
                      top: isExpanded ? 0 : (cardH - dotSize) / 2,
                      width: isExpanded ? cardW : dotSize,
                      height: isExpanded ? cardH : dotSize,
                      padding: isExpanded ? '6px 12px 6px 8px' : 0,
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      outline: isSelected ? `2px solid ${p.color}` : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0" style={{ background: p.color }}>
                      <Icon size={16} color="#fff" strokeWidth={2.2} />
                    </span>
                    <span
                      className="text-left leading-tight overflow-hidden whitespace-nowrap transition-opacity duration-150"
                      style={{ opacity: isExpanded ? 1 : 0 }}
                    >
                      <span className="block text-[11px] font-medium" style={{ color: PALETTE.subtext }}>
                        {p.name}
                      </span>
                      <span className="block text-[13px] font-bold whitespace-nowrap" style={{ color: PALETTE.text }}>
                        {formatNumber(p.value)}
                      </span>
                    </span>
                  </button>
                </div>
              </foreignObject>
            );
          })}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-1.5">
        <button onClick={() => zoomBy(1.4)} aria-label="Zoom in" title="Zoom in" className="w-9 h-9 rounded-xl bg-white/95 shadow-md flex items-center justify-center hover:bg-white">
          <Plus size={16} color={PALETTE.text} />
        </button>
        <button onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out" title="Zoom out" className="w-9 h-9 rounded-xl bg-white/95 shadow-md flex items-center justify-center hover:bg-white">
          <Minus size={16} color={PALETTE.text} />
        </button>
        <button onClick={resetZoom} aria-label="Reset view" title="Reset view" className="w-9 h-9 rounded-xl bg-white/95 shadow-md flex items-center justify-center hover:bg-white">
          <RotateCcw size={14} color={PALETTE.text} />
        </button>
      </div>
      <div className="absolute right-4 top-[9.5rem] text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/80" style={{ color: PALETTE.subtext }}>
        {Math.round(transform.k * 100)}%
      </div>

      {/* click-to-inspect hex popup */}
      {selectedHex && (() => {
        const accent = categoryColor(selectedHex);
        const { lon, lat } = xyToLatLon(selectedHex.x, selectedHex.y);
        const rows: { icon: LucideIcon; label: string; value: string }[] = [
          { icon: MapPinned, label: 'Nearest hub', value: selectedHex.nearest ? selectedHex.nearest.name : '—' },
          { icon: Users, label: 'Users', value: selectedHex.nearest ? formatNumber(selectedHex.nearest.value) : '—' },
          { icon: Ruler, label: 'Distance', value: `${selectedHex.nearestDist} px` },
          { icon: Compass, label: 'Lat / Lon', value: `${lat.toFixed(1)}°, ${lon.toFixed(1)}°` },
        ];
        return (
          <div
            className="absolute left-4 top-4 w-64 rounded-2xl bg-white shadow-[0_20px_45px_rgba(43,46,99,0.28)] border border-black/[0.04] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: accent }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: hexToRgba(accent, 0.14) }}>
                    <MapPinned size={16} color={accent} strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="text-[10.5px] font-medium tracking-wide uppercase" style={{ color: PALETTE.subtext }}>
                      {selectedHex.region || 'Unmapped'}
                    </div>
                    <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: accent, background: hexToRgba(accent, 0.12) }}>
                      {selectedHex.category}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedHex(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 shrink-0 transition-colors" aria-label="Close">
                  <X size={14} color={PALETTE.subtext} />
                </button>
              </div>

              <div className="h-px w-full bg-black/[0.06] mb-3" />

              <div className="space-y-2.5">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5" style={{ color: PALETTE.subtext }}>
                      <row.icon size={13} strokeWidth={2.2} />
                      {row.label}
                    </span>
                    <span className="font-semibold" style={{ color: PALETTE.text }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-black/[0.06] text-[10px] font-mono tracking-tight" style={{ color: PALETTE.subtext }}>
                tile #{String(selectedHex.id).padStart(4, '0')}
              </div>
            </div>
          </div>
        );
      })()}

      {/* bottom-left stat */}
      <div className="absolute left-5 bottom-4">
        <div className="text-xl font-bold" style={{ color: PALETTE.text }}>
          {formatNumber(newUsers)}
        </div>
        <div className="text-xs" style={{ color: PALETTE.subtext }}>
          New users
        </div>
      </div>

      {/* bottom-right footer label (from the API) */}
      {footerLabel && (
        <div
          className="absolute right-5 bottom-4 px-3 py-1.5 rounded-full bg-white/90 shadow-md text-[11px] font-medium"
          style={{ color: PALETTE.subtext }}
        >
          {footerLabel}
        </div>
      )}
    </div>
  );
}
