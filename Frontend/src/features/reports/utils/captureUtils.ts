// This utility file handles printing, image capture, file download, and sharing of report sections. 
// It provides reusable functions to print a selected DOM element, convert it into a PNG image, download the image, or share it using the browser's native sharing capabilities.

import { toBlob } from 'html-to-image'

/** Captures a DOM element as PNG and triggers browser print with preserved styling. */
export function printElement(element: HTMLElement, title = 'Reports Overview') {
  const previousTitle = document.title
  document.title = title
  element.setAttribute('data-print-active', 'true')
  document.body.setAttribute('data-reports-print', 'true')

  const cleanup = () => {
    element.removeAttribute('data-print-active')
    document.body.removeAttribute('data-reports-print')
    document.title = previousTitle
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
}

/** Downloads a blob as a file. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Captures element as PNG blob using html-to-image. */
export async function captureElementAsPng(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })
  if (!blob) throw new Error('Image capture failed')
  return blob
}

import type { ShareOption } from '../components/ShareOptionsModal'

/** Shares captured element image through selected option. */
export async function shareElementAsImage(element: HTMLElement, filename: string, shareText?: string, option: ShareOption = 'native') {
  const title = 'Reports Overview'
  const url = window.location.href

  const blob = await captureElementAsPng(element)

  const file = new File([blob], filename, { type: 'image/png' })
  const fallbackShareData = { title, text: shareText ?? title, url }

  if (navigator.share) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title })
        return
      }
      await navigator.share(fallbackShareData)
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
      // If it fails for another reason, fall through to download
    }
  }

  // Fallback if native fails
  downloadBlob(blob, filename)
}
