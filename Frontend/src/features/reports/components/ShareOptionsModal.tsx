import React from 'react'
import { createPortal } from 'react-dom'
import { Share2, X } from 'lucide-react'

export type ShareOption = 'native'

interface ShareOptionsModalProps {
  open: boolean
  onClose: () => void
  onSelect: (option: ShareOption) => void
  mode?: 'image' | 'excel'
  isProcessing?: boolean
}

export const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
  open,
  onClose,
  onSelect,
  mode = 'image',
  isProcessing = false,
}) => {
  if (!open) return null

  const options = [
    { id: 'native' as const, label: 'Share via System', desc: 'Open native device share sheet (Attaches File)', icon: Share2 },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(5,0,88,0.42)] p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(5,0,88,0.08)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(5,0,88,0.08)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-navy)]">Share Options</h2>
            <p className="text-[12px] text-[var(--color-ink-muted)]">
              {mode === 'excel' ? 'Share the detailed table export' : 'Share the current view snapshot'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-4">
          {options.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={isProcessing}
              onClick={() => onSelect(id)}
              className="flex w-full items-start gap-3 rounded-xl border border-[rgba(5,0,88,0.08)] p-4 text-left transition-colors hover:border-[var(--color-gold)] hover:bg-[var(--color-ice)] disabled:opacity-60"
            >
              <div className="rounded-lg bg-[rgba(206,155,1,0.12)] p-2 text-[var(--color-gold)]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-navy)]">{label}</p>
                <p className="text-[12px] text-[var(--color-ink-muted)]">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
