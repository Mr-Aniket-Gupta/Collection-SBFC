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

import type { ShareOption } from '../components/ShareOptionsModal'

/** Shares visible data as an Excel file through selected option. */
export async function shareExcelWorkbook(sheets: ExcelSheet[], filename: string, shareText?: string, option: ShareOption = 'native') {
  const title = 'Reports Export'
  const url = window.location.href

  const buffer = await writeWorkbookBuffer(sheets)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const file = new File([blob], filename, { type: blob.type })
  const fallbackShareData = { title, text: shareText ?? `Sharing ${filename}`, url }

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

  // Fallback
  const objUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(objUrl)
}

/** Shares visible data as a CSV file through selected option (better compatibility with Web Share API). */
export async function shareCsvFile(sheets: ExcelSheet[], filename: string, shareText?: string, option: ShareOption = 'native') {
  const title = 'Reports Export'
  const url = window.location.href

  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const { name, rows } = sheets[0] // CSV only supports one sheet
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ message: 'No data' }])
  XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31))
  
  const buffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' })
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' })
  
  const csvFilename = filename.replace(/\.xlsx$/, '.csv')
  const file = new File([blob], csvFilename, { type: blob.type })
  const fallbackShareData = { title, text: shareText ?? `Sharing ${csvFilename}`, url }

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
    }
  }

  const objUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objUrl
  anchor.download = csvFilename
  anchor.click()
  URL.revokeObjectURL(objUrl)
}
