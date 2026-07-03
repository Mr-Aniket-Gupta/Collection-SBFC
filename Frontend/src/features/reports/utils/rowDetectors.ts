/** Detects DCSP row types for filtering and chart builders. */
export const isCommunicationRow = (row: Record<string, unknown>) =>
  'channel' in row || 'communication_id' in row

export const isCaseRow = (row: Record<string, unknown>) =>
  ('dpd_case_id' in row || 'pre_emi_case_id' in row || 'bounce_case_id' in row || 'case_ref' in row || 'case_id' in row) &&
  ('dpd' in row || 'pre_emi_amount' in row || 'bounce_date' in row)

export const isStrategyRow = (row: Record<string, unknown>) =>
  'strategy_id' in row || 'strategy_name' in row || 'bucket' in row

export const isPaymentRow = (row: Record<string, unknown>) =>
  'payment_id' in row || 'payment_mode' in row || 'payment_status' in row
