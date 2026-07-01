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

/** Captures element as PNG blob using html2canvas. */
export async function captureElementAsPng(element: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Image capture failed'))), 'image/png')
  })
}

/** Shares or downloads captured element image. */
export async function shareElementAsImage(element: HTMLElement, filename: string) {
  const blob = await captureElementAsPng(element)
  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Reports Overview' })
        return
      }
    } catch {
      // fall through to download when share is blocked or denied
    }
  }

  downloadBlob(blob, filename)
}
