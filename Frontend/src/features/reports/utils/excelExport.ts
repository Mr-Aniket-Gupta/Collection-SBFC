import * as XLSX from 'xlsx'
import { ReportItem } from '../types'

export const exportReportsToExcel = (reports: ReportItem[], filename = 'Report_Library_Export.xlsx') => {
  // Format the objects for Excel representation
  const formattedData = reports.map((r) => ({
    'Report ID': r.id,
    'Report Name': r.name,
    'Category': r.category,
    'Created By': r.createdBy,
    'Created Date': r.createdDate,
    'Status': r.status,
    'Record Count': r.recordCount,
    'File Size': r.fileSize,
    'Schedule / Cron': r.cronExpression,
    'Description': r.description
  }))

  const worksheet = XLSX.utils.json_to_sheet(formattedData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
  
  // Triggers immediate browser download
  XLSX.writeFile(workbook, filename)
}

export const exportReportRowToExcel = (report: ReportItem) => {
  const detailedData = [
    { Property: 'Report ID', Detail: report.id },
    { Property: 'Report Name', Detail: report.name },
    { Property: 'Category', Detail: report.category },
    { Property: 'Created By', Detail: report.createdBy },
    { Property: 'Created Date', Detail: report.createdDate },
    { Property: 'Status', Detail: report.status },
    { Property: 'Record Count', Detail: report.recordCount },
    { Property: 'File Size', Detail: report.fileSize },
    { Property: 'Schedule / Cron', Detail: report.cronExpression },
    { Property: 'Description', Detail: report.description },
    { Property: 'SQL Query Query Statement', Detail: report.sqlQuery }
  ]

  const worksheet = XLSX.utils.json_to_sheet(detailedData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Detail Profile')
  
  XLSX.writeFile(workbook, `Report_${report.id}_Metadata.xlsx`)
}
