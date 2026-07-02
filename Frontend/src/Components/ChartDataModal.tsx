import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface ChartDataModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
}

export const ChartDataModal: React.FC<ChartDataModalProps> = ({ isOpen, onClose, title, data }) => {
  const [isRendered, setIsRendered] = React.useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      // Slight delay to allow the modal animation to start smoothly before rendering the potentially heavy table
      const timer = setTimeout(() => setIsRendered(true), 150)
      return () => {
        window.removeEventListener('keydown', handleEsc)
        clearTimeout(timer)
      }
    } else {
      setIsRendered(false)
    }
  }, [isOpen, onClose])

  // Ensure we get all columns if objects have different keys
  const columns = React.useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    if (!data) return ordered
    data.forEach(row => {
      if (typeof row !== 'object' || row === null) return
      Object.keys(row).forEach(key => {
        if (!seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      })
    })
    return ordered.filter((col) => {
      const lower = col.toLowerCase()
      return lower !== 'color' && lower !== 'bgcolor' && lower !== 'iconcolor'
    })
  }, [data])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-[rgba(5,0,88,0.4)] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-[1600px] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[rgba(5,0,88,0.08)] bg-[var(--color-ice)]">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-navy)]">{title}</h3>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-1">Detailed data view</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 rounded-xl hover:bg-[rgba(5,0,88,0.1)] text-[var(--color-navy)] transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white relative">
          {!isRendered ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-[var(--color-ice)] border-t-[var(--color-gold)] rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-medium text-[var(--color-navy)]">Loading data view...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--color-ink-muted)]">No data available</div>
          ) : (
            <div className="rounded-xl border border-[rgba(5,0,88,0.08)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-ice)] sticky top-0 shadow-sm z-10">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-[12px] uppercase tracking-[0.16em] font-bold text-[var(--color-navy)] whitespace-nowrap border-b border-[rgba(5,0,88,0.08)]">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-[rgba(5,0,88,0.06)] hover:bg-[rgba(5,0,88,0.02)] transition-colors">
                      {columns.map(col => {
                        const val = row[col]
                        let rendered = '-'
                        if (val !== null && val !== undefined) {
                          rendered = typeof val === 'object' ? JSON.stringify(val) : String(val)
                        }
                        return (
                          <td key={col} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-[14px] text-[var(--color-navy)] max-w-[200px] sm:max-w-[400px] truncate" title={rendered}>
                            {rendered}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
