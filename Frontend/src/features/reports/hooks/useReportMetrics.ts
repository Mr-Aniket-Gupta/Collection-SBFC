import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../services/reportsService'

export const useReportMetrics = (category?: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reportMetrics', category],
    queryFn: () => reportsService.fetchMetrics(category),
    placeholderData: (prev) => prev
  })

  return {
    metrics: data?.kpis,
    channelConversion: data?.channelConversion || [],
    bucketTrend: data?.bucketTrend || [],
    collectionTrend: data?.collectionTrend || [],
    recoveryDistribution: data?.recoveryDistribution || [],
    isLoading,
    error,
    refetch
  }
}
