export const formatCurrencyINR = (amount: number): string => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatPercent = (value: number): string => `${clampPercent(value).toFixed(1)}%`

export const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN').format(value)

export const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export const formatCappedPercent = (value: number): string => `${clampPercent(value).toFixed(1)}%`
