import { Joyride, ACTIONS, STATUS } from "react-joyride";
import type { EventData, Step } from "react-joyride";

interface AppTourProps {
  run: boolean;
  steps: Step[];
  onFinish?: () => void;
  onStepChange?: (data: EventData) => void;
}

export default function AppTour({
  run,
  steps,
  onFinish,
  onStepChange,
}: AppTourProps) {
  const handleEvent = (data: EventData) => {
    onStepChange?.(data);

    const finished =
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED ||
      data.action === ACTIONS.CLOSE;

    if (finished) {
      onFinish?.();
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      onEvent={handleEvent}
      continuous
      options={{
        primaryColor: "#000182",
        zIndex: 10000,
        backgroundColor: "#FFFFFF",
        textColor: "#374151",
        width: 420,
        overlayColor: "rgba(5,0,88,0.55)",
        showProgress: true,
        buttons: ["skip", "back", "primary"],
      }}
      styles={{
        tooltip: {
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 50px rgba(5,0,88,0.15)",
        },
        tooltipContent: {
          fontSize: "15px",
          lineHeight: "1.7",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 700,
          color: "#050058",
          marginBottom: 12,
        },
        buttonPrimary: {
          backgroundColor: "#000182",
          borderRadius: 10,
        },
        buttonBack: {
          color: "#000182",
        },
        buttonSkip: {
          color: "#6B7280",
        },
      }}
    />
  );
}
