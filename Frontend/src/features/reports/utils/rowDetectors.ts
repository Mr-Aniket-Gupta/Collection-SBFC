/**
 * Description of what this function does: Detects if the given row represents a communication_logs record.
 * Inputs: row: Record<string, unknown>
 * Outputs: boolean
 * Dependencies: none
 */
export const isCommunicationLogsRow = (row: Record<string, unknown>) =>
  'communication_id' in row || ('channel' in row && ('recipient' in row || 'created_on' in row))

/**
 * Description of what this function does: Detects if the given row represents a case record (dpd, pre-emi, bounce, etc.).
 * Inputs: row: Record<string, unknown>
 * Outputs: boolean
 * Dependencies: none
 */
export const isCaseRow = (row: Record<string, unknown>) =>
  ('dpd_case_id' in row || 'pre_emi_case_id' in row || 'bounce_case_id' in row || 'case_ref' in row || 'case_id' in row) &&
  ('dpd' in row || 'pre_emi_amount' in row || 'bounce_date' in row)

/**
 * Description of what this function does: Detects if the given row represents a strategy record.
 * Inputs: row: Record<string, unknown>
 * Outputs: boolean
 * Dependencies: none
 */
export const isStrategyRow = (row: Record<string, unknown>) =>
  'strategy_id' in row || 'strategy_name' in row || 'bucket' in row

/**
 * Description of what this function does: Detects if the given row represents a payment record.
 * Inputs: row: Record<string, unknown>
 * Outputs: boolean
 * Dependencies: none
 */
export const isPaymentRow = (row: Record<string, unknown>) =>
  'payment_id' in row || 'payment_mode' in row || 'payment_status' in row
