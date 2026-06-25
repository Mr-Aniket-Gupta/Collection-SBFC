export const formatCurrencyINR = (amount: number): string => {
  if (Math.abs(amount) >= 10000000) {
    // 1 Crore = 10,000,000
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (Math.abs(amount) >= 100000) {
    // 1 Lakh = 100,000
    return `₹${(amount / 100000).toFixed(2)}Lakh`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-IN').format(value)
}

export const formatDate = (dateStr: string): string => {
  return dateStr // Ready to extend if formatting standard timestamp format
}
