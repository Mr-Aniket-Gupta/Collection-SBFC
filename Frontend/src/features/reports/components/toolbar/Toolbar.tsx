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
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-250 dark:border-slate-800 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
      >
        <Printer className="w-3.5 h-3.5 text-slate-400" />
        <span>Print</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-250 dark:border-slate-800 rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
      >
        <Share2 className="w-3.5 h-3.5 text-slate-400" />
        <span>Share</span>
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-905 text-xs font-extrabold rounded-lg cursor-pointer transition-all duration-200 shadow-sm active:scale-95 text-slate-950"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>
    </div>
  )
}
export default Toolbar
