import type { DashboardMapResponse } from "./Hexworldmap";

/** Local fallback matching the /api/dashboard/map response contract. */
export const mapDummyData: DashboardMapResponse = {
  newUsers: 22652,
  label: "Updated 2 min ago",
  locations: [
    { id: "delhi", name: "Delhi NCR", value: 98320300, lat: 28.6139, lon: 77.209, color: "#4fa4e0", icon: "Landmark", cardSide: "right" },
    { id: "mumbai", name: "Mumbai", value: 78245600, lat: 19.076, lon: 72.8777, color: "#000182", icon: "Building2", cardSide: "right" },
    { id: "bengaluru", name: "Bengaluru", value: 64891200, lat: 12.9716, lon: 77.5946, color: "#CE9B01", icon: "Library", cardSide: "left" },
    { id: "hyderabad", name: "Hyderabad", value: 43567800, lat: 17.385, lon: 78.4867, color: "#4fbf8b", icon: "Warehouse", cardSide: "left" },
    { id: "chennai", name: "Chennai", value: 59432100, lat: 13.0827, lon: 80.2707, color: "#cf7fdb", icon: "Factory", cardSide: "left" },
    { id: "kolkata", name: "Kolkata", value: 31876400, lat: 22.5726, lon: 88.3639, color: "#ee7c68", icon: "Building2", cardSide: "left" },
    { id: "pune", name: "Pune", value: 27456300, lat: 18.5204, lon: 73.8567, color: "#5a8fe0", icon: "School", cardSide: "right" },
    { id: "ahmedabad", name: "Ahmedabad", value: 42198700, lat: 23.0225, lon: 72.5714, color: "#f2a458", icon: "Landmark", cardSide: "right" },
  ],
};
