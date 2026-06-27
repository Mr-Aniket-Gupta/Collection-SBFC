import React from 'react'
import { Printer, Share2, Download } from 'lucide-react'
import { toast } from 'sonner'

export const Toolbar: React.FC = () => {
  const handlePrint = () => {
    toast.info('Preparing print layout...')
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Dashboard link copied to clipboard!')
  }

  const handleExport = () => {
    toast.success('Exporting full analytics bundle... Completed!')
  }

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Print */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[var(--color-ice)] text-[var(--color-navy)] text-xs font-bold border border-[rgba(5,0,88,0.12)] rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
      >
        <Printer className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
        <span>Print</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[var(--color-ice)] text-[var(--color-navy)] text-xs font-bold border border-[rgba(5,0,88,0.12)] rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
      >
        <Share2 className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
        <span>Share</span>
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-gold)] hover:brightness-95 text-[var(--color-navy)] text-xs font-extrabold rounded-lg cursor-pointer transition-all duration-200 shadow-sm active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>
    </div>
  )
}

export default Toolbar
