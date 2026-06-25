import { mockReports, mockKpis, mockChannelConversion, mockBucketTrend, mockCollectionTrend, mockRecoveryDistribution } from '../data/mockData'
import { ReportItem, ReportMetricsPayload } from '../types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const reportsService = {
  async fetchReports(params: {
    category?: string
    status?: string
    search?: string
    page: number
    limit: number
    sortBy: keyof ReportItem
    sortOrder: 'asc' | 'desc'
  }): Promise<{ reports: ReportItem[]; total: number }> {
    await delay(350)

    let filtered = [...mockReports]

    // Apply category filter
    if (params.category && params.category !== 'All') {
      filtered = filtered.filter(
        (r) => r.category.toLowerCase() === params.category?.toLowerCase()
      )
    }

    // Apply status filter
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(
        (r) => r.status.toLowerCase() === params.status?.toLowerCase()
      )
    }

    // Apply search filter
    if (params.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.createdBy.toLowerCase().includes(q)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valA = a[params.sortBy]
      let valB = b[params.sortBy]

      if (typeof valA === 'string' && typeof valB === 'string') {
        return params.sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return params.sortOrder === 'asc' ? valA - valB : valB - valA
      }

      return 0
    })

    // Apply pagination
    const startIndex = (params.page - 1) * params.limit
    const paginated = filtered.slice(startIndex, startIndex + params.limit)

    return {
      reports: paginated,
      total: filtered.length
    }
  },

  async fetchMetrics(category?: string): Promise<ReportMetricsPayload> {
    await delay(250)

    // Dynamic metrics generation to make the dashboard feel reactive when clicking categories
    if (!category || category === 'All') {
      return {
        kpis: mockKpis,
        channelConversion: mockChannelConversion,
        bucketTrend: mockBucketTrend,
        collectionTrend: mockCollectionTrend,
        recoveryDistribution: mockRecoveryDistribution
      }
    }

    // Hash or seed multiplier based on category name to generate consistent dynamic mock data
    const seed = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const factor = 0.4 + (seed % 50) / 100 // yields a factor between 0.4 and 0.9

    const modifiedKpis = {
      totalCollection: Math.round(mockKpis.totalCollection * factor),
      totalCollectionTrend: Number((mockKpis.totalCollectionTrend * (factor > 0.6 ? 1.1 : -0.8)).toFixed(1)),
      digitalCollection: Math.round(mockKpis.digitalCollection * factor * 1.2),
      digitalCollectionTrend: Number((mockKpis.digitalCollectionTrend * (factor > 0.6 ? 0.9 : 1.3)).toFixed(1)),
      resolutionRate: Number(Math.min(95, mockKpis.resolutionRate * (0.8 + factor * 0.3)).toFixed(1)),
      resolutionRateTrend: Number((mockKpis.resolutionRateTrend * (factor > 0.5 ? 1.2 : -0.5)).toFixed(1)),
      casesResolved: Math.round(mockKpis.casesResolved * factor),
      casesResolvedTrend: Number((mockKpis.casesResolvedTrend * factor).toFixed(1))
    }

    const modifiedChannelConversion = mockChannelConversion.map((item) => ({
      channel: item.channel,
      sent: Math.round(item.sent * factor),
      responded: Math.round(item.responded * factor),
      converted: Math.round(item.converted * factor)
    }))

    const modifiedBucketTrend = mockBucketTrend.map((item) => ({
      month: item.month,
      '0-30 DPD': Math.round(item['0-30 DPD'] * factor),
      '31-60 DPD': Math.round(item['31-60 DPD'] * factor),
      '61-90 DPD': Math.round(item['61-90 DPD'] * factor),
      '91-120 DPD': Math.round(item['91-120 DPD'] * factor),
      '120+ DPD': Math.round(item['120+ DPD'] * factor)
    }))

    const modifiedCollectionTrend = mockCollectionTrend.map((item) => ({
      month: item.month,
      collection: Number((item.collection * factor).toFixed(1)),
      target: Number((item.target * factor).toFixed(1))
    }))

    const modifiedRecoveryDistribution = mockRecoveryDistribution.map((item) => {
      // Give different distribution shares depending on category to look organic
      let val = item.value
      if (category.includes('Digital') && item.name === 'Digital') val *= 1.5
      if (category.includes('Strategy') && item.name === 'Agency') val *= 1.3
      if (category.includes('Communication') && item.name === 'Telecalling') val *= 1.4
      return { name: item.name, value: Math.round(val) }
    })

    return {
      kpis: modifiedKpis,
      channelConversion: modifiedChannelConversion,
      bucketTrend: modifiedBucketTrend,
      collectionTrend: modifiedCollectionTrend,
      recoveryDistribution: modifiedRecoveryDistribution
    }
  },

  async getReportById(id: string): Promise<ReportItem | null> {
    await delay(150)
    const report = mockReports.find((r) => r.id === id)
    return report || null
  }
}
