import {
  ReportItem,
  MetricSummary,
  ChannelConversionData,
  BucketWiseTrendData,
  CollectionTrendData,
  RecoveryDistributionData
} from '../types'

export const mockKpis: MetricSummary = {
  totalCollection: 437500000, // 43.75 Cr
  totalCollectionTrend: -3.9,
  digitalCollection: 189700000, // 18.97 Cr
  digitalCollectionTrend: 12.6,
  resolutionRate: 63.3,
  resolutionRateTrend: 2.9,
  casesResolved: 11376,
  casesResolvedTrend: 8.8
}

export const mockChannelConversion: ChannelConversionData[] = [
  { channel: 'SMS', sent: 12000, responded: 3000, converted: 800 },
  { channel: 'WhatsApp', sent: 16000, responded: 8500, converted: 2200 },
  { channel: 'AI Call', sent: 18000, responded: 9500, converted: 3800 },
  { channel: 'Manual Call', sent: 14000, responded: 8000, converted: 4200 },
  { channel: 'Email', sent: 5000, responded: 1200, converted: 300 },
  { channel: 'Field', sent: 17500, responded: 5000, converted: 2800 }
].reverse() // Reversed to match bottom-up display order in horizontal charts

export const mockBucketTrend: BucketWiseTrendData[] = [
  { month: 'Aug', '0-30 DPD': 120, '31-60 DPD': 80, '61-90 DPD': 40, '91-120 DPD': 25, '120+ DPD': 15 },
  { month: 'Sep', '0-30 DPD': 130, '31-60 DPD': 85, '61-90 DPD': 45, '91-120 DPD': 22, '120+ DPD': 18 },
  { month: 'Oct', '0-30 DPD': 110, '31-60 DPD': 90, '61-90 DPD': 38, '91-120 DPD': 28, '120+ DPD': 20 },
  { month: 'Nov', '0-30 DPD': 140, '31-60 DPD': 95, '61-90 DPD': 50, '91-120 DPD': 30, '120+ DPD': 25 },
  { month: 'Dec', '0-30 DPD': 150, '31-60 DPD': 100, '61-90 DPD': 55, '91-120 DPD': 35, '120+ DPD': 28 },
  { month: 'Jan', '0-30 DPD': 165, '31-60 DPD': 110, '61-90 DPD': 60, '91-120 DPD': 40, '120+ DPD': 32 }
]

export const mockCollectionTrend: CollectionTrendData[] = [
  { month: 'Aug', collection: 54, target: 45 },
  { month: 'Sep', collection: 52, target: 43 },
  { month: 'Oct', collection: 58, target: 48 },
  { month: 'Nov', collection: 62, target: 51 },
  { month: 'Dec', collection: 56, target: 49 },
  { month: 'Jan', collection: 64, target: 53 }
]

export const mockRecoveryDistribution: RecoveryDistributionData[] = [
  { name: 'Digital', value: 40 },
  { name: 'Agency', value: 25 },
  { name: 'Field', value: 20 },
  { name: 'Telecalling', value: 15 }
]

export const mockReports: ReportItem[] = [
  {
    id: 'RPT-10239',
    name: 'Communication Outreach Summary',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '24 Jun 2026',
    status: 'Scheduled',
    sqlQuery: 'SELECT channel, COUNT(*) as sent, SUM(CASE WHEN status = "responded" THEN 1 ELSE 0 END) as responded FROM outreach_logs GROUP BY channel ORDER BY sent DESC;',
    recordCount: 48250,
    fileSize: '3.4 MB',
    cronExpression: '0 9 * * 1-5 (Mon-Fri 9:00 AM)',
    description: 'Daily compilation of all digital customer touches (SMS, WhatsApp, AI voice bots, and emails) showing delivery and initial responses.'
  },
  {
    id: 'RPT-10246',
    name: 'Daily Recovery Snapshot',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '15 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT date, SUM(amount_collected) as daily_total, COUNT(DISTINCT case_id) as cases_settled FROM collection_transactions WHERE date = CURRENT_DATE - 1 GROUP BY date;',
    recordCount: 12400,
    fileSize: '1.2 MB',
    cronExpression: 'Ad-hoc (Manual Run)',
    description: 'Consolidated report of prior day receipts across all collection nodes (telecalling, fields, and self-pay digital gateways).'
  },
  {
    id: 'RPT-10257',
    name: 'Settlement Pipeline',
    category: 'Digital Recovery',
    createdBy: 'M. Khan',
    createdDate: '14 Jun 2026',
    status: 'Failed',
    sqlQuery: 'SELECT s.case_id, s.proposed_amount, s.waived_amount, c.dpd_band FROM settlement_proposals s JOIN cases c ON s.case_id = c.id WHERE s.approval_status = "pending";',
    recordCount: 0,
    fileSize: '0 KB',
    cronExpression: '0 18 * * * (Daily 6:00 PM)',
    description: 'Current pipeline of settlement offers submitted by agents or digital suggestions awaiting supervisor checkoff.'
  },
  {
    id: 'RPT-10260',
    name: 'Agency Wise Recovery',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '13 Jun 2026',
    status: 'Scheduled',
    sqlQuery: 'SELECT agency_name, COUNT(*) as allocated_cases, SUM(recovered_amount) as total_recovered FROM external_allocations GROUP BY agency_name;',
    recordCount: 3840,
    fileSize: '480 KB',
    cronExpression: '0 0 * * 0 (Weekly Sunday 12:00 AM)',
    description: 'Weekly comparison audit of physical outsourced agency partners tracking resolution speeds and target percentages.'
  },
  {
    id: 'RPT-10271',
    name: 'Bucket 1 Resolution Metrics',
    category: 'Bucket-wise MIS',
    createdBy: 'R. Sharma',
    createdDate: '12 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT case_owner, COUNT(*) as active_cases, SUM(recovered_amount) as bucket_1_recovered FROM cases WHERE dpd_band = "0-30" GROUP BY case_owner;',
    recordCount: 9210,
    fileSize: '950 KB',
    cronExpression: 'Ad-hoc (Manual Run)',
    description: 'Detailed analysis of account flow rates specifically inside the initial 0-30 DPD critical window.'
  },
  {
    id: 'RPT-10272',
    name: 'Bucket 2 & 3 Flow Analysis',
    category: 'Bucket-wise MIS',
    createdBy: 'R. Sharma',
    createdDate: '12 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT previous_dpd, current_dpd, COUNT(*) as transition_count FROM case_flow_history WHERE date_range = "Last 30 Days";',
    recordCount: 6540,
    fileSize: '710 KB',
    cronExpression: '0 8 * * 1 (Weekly Monday 8:00 AM)',
    description: 'Roll rate tracking showing accounts transitioning from Bucket 2 (31-60 DPD) into Bucket 3 (61-90 DPD).'
  },
  {
    id: 'RPT-10281',
    name: 'UPI & NetBanking Success Logs',
    category: 'Digital Recovery',
    createdBy: 'M. Khan',
    createdDate: '10 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT gateway, COUNT(*) as attempts, SUM(CASE WHEN status="success" THEN 1 ELSE 0 END)/COUNT(*) as success_rate FROM payment_gateway_logs GROUP BY gateway;',
    recordCount: 110500,
    fileSize: '9.8 MB',
    cronExpression: '0 */4 * * * (Every 4 Hours)',
    description: 'Digital self-serve payment page performance statistics across UPI, NetBanking, and credit/debit card routes.'
  },
  {
    id: 'RPT-10285',
    name: 'Auto-Debit Bounce Ledger',
    category: 'Bounce Analysis',
    createdBy: 'A. Joshi',
    createdDate: '09 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT bank_name, reason_code, COUNT(*) as bounce_count, SUM(nach_amount) as value FROM nach_bounce_records GROUP BY bank_name, reason_code;',
    recordCount: 35200,
    fileSize: '2.8 MB',
    cronExpression: '0 10 5 * * (Monthly 5th at 10:00 AM)',
    description: 'E-mandate / NACH failure reasons audit categorized by bank codes, helping detect structural payment system faults.'
  },
  {
    id: 'RPT-10290',
    name: 'Digital Link Click-Through Performance',
    category: 'Digital Recovery',
    createdBy: 'M. Khan',
    createdDate: '08 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT campaign_id, sms_sent, link_clicks, payments_completed FROM campaign_metrics WHERE campaign_type = "digital_link";',
    recordCount: 54100,
    fileSize: '3.9 MB',
    cronExpression: '0 23 * * * (Daily 11:00 PM)',
    description: 'SMS and WhatsApp customized payment links conversion funnels detailing view-to-payment click logs.'
  },
  {
    id: 'RPT-10301',
    name: 'Allocation Strategy Performance Audit',
    category: 'Strategy Reports',
    createdBy: 'H. Mehta',
    createdDate: '07 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT strategy_id, strategy_name, allocated_cases, conversion_rate FROM collection_strategies WHERE is_active = true;',
    recordCount: 220,
    fileSize: '45 KB',
    cronExpression: 'Ad-hoc (Manual Run)',
    description: 'Evaluation audit tracking collection return percentage across different automated customer segment allocations.'
  },
  {
    id: 'RPT-10304',
    name: 'Write-off Risk Forecasting',
    category: 'Strategy Reports',
    createdBy: 'H. Mehta',
    createdDate: '06 Jun 2026',
    status: 'Scheduled',
    sqlQuery: 'SELECT account_no, dpd, probability_of_default, predicted_loss FROM writeoff_risk_model WHERE probability_of_default > 0.85;',
    recordCount: 1450,
    fileSize: '320 KB',
    cronExpression: '0 1 * * 0 (Weekly Sunday 1:00 AM)',
    description: 'Machine learning model projections output flagging high DPD accounts that show elevated default patterns.'
  },
  {
    id: 'RPT-10310',
    name: 'Cash Depot Reconciliation Audit',
    category: 'Payment MIS',
    createdBy: 'S. Nair',
    createdDate: '05 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT branch_code, agent_id, collected_cash, deposited_cash, discrepancy FROM branch_cash_journals WHERE discrepancy <> 0;',
    recordCount: 480,
    fileSize: '88 KB',
    cronExpression: '0 20 * * * (Daily 8:00 PM)',
    description: 'Physical field agent cash collection ledger matches against bank deposit slips to verify zero deposits leakage.'
  },
  {
    id: 'RPT-10320',
    name: 'Voice Bot Call Center Output Logs',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '04 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT call_duration_secs, intent_detected, customer_action FROM voice_bot_sessions WHERE date = CURRENT_DATE - 1;',
    recordCount: 95000,
    fileSize: '8.4 MB',
    cronExpression: '0 7 * * * (Daily 7:00 AM)',
    description: 'Detailing conversational interactions, intent analysis, and opt-ins generated by conversational AI calling systems.'
  },
  {
    id: 'RPT-10332',
    name: 'PTR (Promise to Pay) Compliance Ledger',
    category: 'Recovery MIS',
    createdBy: 'R. Sharma',
    createdDate: '03 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT agent_id, count(ptp_id) as total_ptps, SUM(CASE WHEN ptp_status = "kept" THEN 1 ELSE 0 END)/count(ptp_id) as kept_ratio FROM ptp_ledger GROUP BY agent_id;',
    recordCount: 18900,
    fileSize: '1.9 MB',
    cronExpression: '0 6 * * * (Daily 6:00 AM)',
    description: 'Report tracking the fulfillment ratios of customer promises to pay (PTP) to assess talk track efficiencies.'
  },
  {
    id: 'RPT-10340',
    name: 'Cheque Bounce Tracking Ledger',
    category: 'Bounce Analysis',
    createdBy: 'A. Joshi',
    createdDate: '02 Jun 2026',
    status: 'Failed',
    sqlQuery: 'SELECT cheque_number, drawer_name, amount, bounce_reason, court_notice_status FROM cheque_transactions WHERE bounce_date IS NOT NULL;',
    recordCount: 0,
    fileSize: '0 KB',
    cronExpression: '0 9 * * 1 (Weekly Monday 9:00 AM)',
    description: 'Cheque returns logs showing drawer details, bank codes, return reasons, and legal notice triggers.'
  },
  {
    id: 'RPT-10355',
    name: 'Digital Gateways Fee Audit',
    category: 'Payment MIS',
    createdBy: 'S. Nair',
    createdDate: '01 Jun 2026',
    status: 'Ready',
    sqlQuery: 'SELECT gateway, volume_processed, commission_rate, total_fees_incurred FROM payment_commissions GROUP BY gateway;',
    recordCount: 1250,
    fileSize: '110 KB',
    cronExpression: '0 0 1 * * (Monthly 1st at 12:00 AM)',
    description: 'Monthly comparison of gateway processing charges, merchant fees, and transaction commissions.'
  },
  {
    id: 'RPT-10360',
    name: 'Legal Notice Dispatch Log',
    category: 'Strategy Reports',
    createdBy: 'H. Mehta',
    createdDate: '30 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT case_id, client_name, notice_type, dispatch_date, tracking_no FROM legal_notices_dispatched WHERE dispatch_date >= CURRENT_DATE - 30;',
    recordCount: 520,
    fileSize: '95 KB',
    cronExpression: 'Ad-hoc (Manual Run)',
    description: 'Record of arbitration and Sec 25 legal notices dispatched to delinquent accounts.'
  },
  {
    id: 'RPT-10375',
    name: 'SMS Click & Opt-out Tracker',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '28 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT campaign_name, total_sent, opt_out_count, opt_out_count/total_sent as opt_out_rate FROM sms_campaigns GROUP BY campaign_name;',
    recordCount: 31200,
    fileSize: '2.1 MB',
    cronExpression: '0 12 * * * (Daily 12:00 PM)',
    description: 'SMS notification click metrics monitoring unsubscribe rate or DND complaints.'
  },
  {
    id: 'RPT-10380',
    name: 'Restructured Loan Portfolio',
    category: 'Recovery MIS',
    createdBy: 'R. Sharma',
    createdDate: '26 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT loan_id, original_tenure, new_tenure, original_emi, new_emi FROM loan_restructuring_agreements WHERE agreement_date >= DATE_SUB(NOW(), INTERVAL 30 DAY);',
    recordCount: 1540,
    fileSize: '290 KB',
    cronExpression: '0 8 * * * (Daily 8:00 AM)',
    description: 'Tracks restructured and modified loans, recording modifications in tenure, EMI reductions, or interest rate relief.'
  },
  {
    id: 'RPT-10390',
    name: 'Field Collections Route Maps',
    category: 'Recovery MIS',
    createdBy: 'R. Sharma',
    createdDate: '24 May 2026',
    status: 'Scheduled',
    sqlQuery: 'SELECT region, agent_id, visits_assigned, visits_completed, collection_efficiency FROM field_agent_routes WHERE date = CURRENT_DATE;',
    recordCount: 880,
    fileSize: '150 KB',
    cronExpression: '0 6 * * * (Daily 6:00 AM)',
    description: 'Geographical route and allocation ledger for physical collection agents detailing field collections performance.'
  },
  {
    id: 'RPT-10401',
    name: 'Collector Incentive Reconciliation',
    category: 'Payment MIS',
    createdBy: 'S. Nair',
    createdDate: '20 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT collector_id, total_collected, target_achieved, incentive_earned FROM incentives_calculated WHERE cycle_month = "May 2026";',
    recordCount: 1820,
    fileSize: '320 KB',
    cronExpression: '0 15 1 * * (Monthly 1st at 3:00 PM)',
    description: 'Incentive calculation logs matching collections performance to commission structures for payouts.'
  },
  {
    id: 'RPT-10410',
    name: 'Nach Mandate Registration Logs',
    category: 'Bounce Analysis',
    createdBy: 'A. Joshi',
    createdDate: '15 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT bank_name, status, COUNT(*) as count FROM nach_registrations GROUP BY bank_name, status;',
    recordCount: 19400,
    fileSize: '1.4 MB',
    cronExpression: '0 0 * * 1 (Weekly Monday 12:00 AM)',
    description: 'Daily registration success rate monitoring for bank automated clearing house e-mandates.'
  },
  {
    id: 'RPT-10420',
    name: 'Auto-Dialer Contactability Report',
    category: 'Communication Reports',
    createdBy: 'K. Patil',
    createdDate: '10 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT hours_bucket, calls_placed, calls_answered, answered_rate FROM dialer_call_logs GROUP BY hours_bucket;',
    recordCount: 172000,
    fileSize: '12.4 MB',
    cronExpression: '0 22 * * * (Daily 10:00 PM)',
    description: 'Hour-by-hour call connect rate tracking to identify optimal callback times per customer segment.'
  },
  {
    id: 'RPT-10430',
    name: 'Bounce Follow-up Strategy Efficacy',
    category: 'Bounce Analysis',
    createdBy: 'A. Joshi',
    createdDate: '05 May 2026',
    status: 'Ready',
    sqlQuery: 'SELECT follow_up_channel, bounce_resolved_count, recovery_amount FROM bounce_followups GROUP BY follow_up_channel;',
    recordCount: 8400,
    fileSize: '890 KB',
    cronExpression: 'Ad-hoc (Manual Run)',
    description: 'Analysis of payment actions taken within 48 hours of an auto-debit bounce trigger, grouped by follow-up strategy.'
  }
]
