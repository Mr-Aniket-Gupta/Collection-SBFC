import type { DcspTableRow } from '../types'
import { safeToString } from './tableUtils'

export interface ExcelSheet {
  name: string
  rows: Record<string, string>[]
}

export const toExportRows = (rows: DcspTableRow[]): Record<string, string>[] =>
  rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeToString(value)])),
  )

const writeWorkbookBuffer = async (sheets: ExcelSheet[]) => {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()

  sheets.forEach(({ name, rows }) => {
    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ message: 'No data' }])
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31))
  })

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

/** Downloads a single-sheet Excel workbook. */
export async function downloadWorkbook(rows: DcspTableRow[], filename: string) {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(rows))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
  XLSX.writeFile(workbook, filename)
}

/** Downloads a multi-sheet Excel workbook. */
export async function downloadMultiSheetWorkbook(sheets: ExcelSheet[], filename: string) {
  const buffer = await writeWorkbookBuffer(sheets)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Shares visible data as an Excel file (Web Share API or download fallback). */
export async function shareExcelWorkbook(sheets: ExcelSheet[], filename: string) {
  const buffer = await writeWorkbookBuffer(sheets)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const file = new File([blob], filename, { type: blob.type })

  if (navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Reports Export' })
        return
      }
    } catch {
      // fall through to download when share is blocked or denied
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
