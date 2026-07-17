import { Step } from "react-joyride";

export const mlAnalyticsTourSteps: Step[] = [
  {
    target: "#tour-hero-section",
    content:
      "This dashboard predicts recovery opportunities across the portfolio and helps identify where collection efforts can generate the highest recovery.",
    placement: "bottom",
  },
  {
    target: "#tour-world-map",
    content:
      "Recovery Opportunity Map showing where recoverable money is concentrated. Bubble size represents expected recovery amount and colors represent average recovery probability.",
    placement: "bottom",
  },
  {
    target: "#tour-kpi-grid",
    content:
      "Key portfolio metrics including total cases, predicted recoverable cases, expected recovery amount, model accuracy, Macro F1 score and average recovery probability.",
  },
  {
    target: "#tour-actual-vs-predicted",
    content:
      "Compare actual recovery against model predicted recovery across zones to identify underperforming and outperforming regions.",
  },
  {
    target: "#tour-recovery-trend",
    content:
      "Monthly trend of actual versus predicted recovery performance to track collection effectiveness and model calibration over time.",
  },
  {
    target: "#tour-confusion-matrix",
    content:
      "Model validation matrix showing how accurately recovery categories are being predicted.",
  },
  {
    target: "#tour-feature-importance",
    content:
      "Top business drivers influencing recovery probability predictions such as DPD, outstanding amount, payment history and customer behavior.",
  },
];
