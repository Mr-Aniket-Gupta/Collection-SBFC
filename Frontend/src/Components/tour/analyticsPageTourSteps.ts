// import { Step } from "react-joyride";
import type { Step } from "react-joyride";

export const analyticsPageTourSteps: Step[] = [
    {
        target: "#analytics-kpi-1",
        content: "Total Outstanding Principal represents the sum of outstanding principal amounts for accounts currently in the PENDING_STRATEGY stage. This metric highlights the principal exposure that has not yet entered an active collection strategy. The value is shown alongside the overall outstanding principal portfolio to provide context on pending workload.",
        placement: "top",
    },
    {
        target: "#analytics-kpi-2",
        content: "Total Outstanding represents the sum of outstanding balances for loans with an ACTIVE status. It is displayed against the total outstanding portfolio value to help monitor the size of the currently active loan book and collection exposure.",
        placement: "bottom",
    },
    {
        target: "#analytics-kpi-3",
        content: "Total Delivered measures communication effectiveness by counting all messages with a delivery status of DELIVERED and comparing them against the total number of communication attempts. A higher value indicates better channel reach and customer contactability.",
        placement: "bottom",
    },
    {
        target: "#analytics-kpi-4",
        content: "PTPs Honoured tracks customer commitment fulfillment by counting Promise-To-Pay records where the honoured flag is TRUE. The metric is shown against all recorded PTP commitments to measure customer reliability and collection strategy effectiveness.",
        placement: "bottom",
    },
    {
        target: "#analytics-card",
        content: "This section highlights the key performance insights for the selected filters, including the best and weakest metrics, top-performing strategy, peak customer contact hour, and risk bucket concentration to help identify collection opportunities and improvement areas.",
        placement: "bottom",
    },
    {
        target: "#analytics-Performance-Radar",
        content: "This radar chart visualizes collection effectiveness across communication, recovery, payment, and closure metrics. Larger coverage indicates stronger overall collection performance.",
        placement: "right",
    },
    {
        target: "#analytics-Strategy-Effectiveness",
        content: "Compare recovery performance across collection strategies and monitor progress against target achievement levels.",
        placement: "left",
    },
    {
        target: "#analytics-hourly-distribution",
        content: "Identify peak customer engagement windows by tracking communication activity and responses across different hours of the day, enabling teams to schedule collection efforts during the most productive time slots.",
    },
    {
        target: "#analytics-Strategy-vs-Target-Gap",
        content: "Identify the gap between assigned collection efforts and successful case closures across strategies, helping teams prioritize underperforming strategies and improve recovery effectiveness.",
    },
    {
        target: "#analytics-Communication-Efficiency",
        content: "Track the effectiveness of collection communications by comparing outreach volume with successful deliveries across different hours of the day. Use these insights to optimize communication timing, improve delivery rates, and maximize customer engagement.",
    },
    {
        target: "#analytics-branch-contribution",
        content: "Visualize branch-wise contribution to collection performance, highlighting key recovery metrics and identifying top-performing branches that can serve as benchmarks.",
    },
    {
        target: "#analytics-agent-contribution",
        content: "Rank agents based on collection performance, enabling you to identify top performers, monitor individual contributions, and provide targeted support to improve overall team effectiveness.",
    },
    {
        target: "#analytics-recovery-efficiency",
        content: "Measure the effectiveness of collection efforts by comparing recovery metrics against assigned targets, allowing you to identify performance gaps and optimize strategies to maximize recovery rates.",
    },
    {
        target: "#analytics-risk-bucket",
        content: "Classify accounts based on risk levels to identify high-priority segments requiring focused collection efforts, enabling you to optimize resource allocation and improve recovery outcomes.",
    },
];