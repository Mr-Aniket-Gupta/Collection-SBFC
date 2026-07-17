import {
    Joyride,
    STATUS,
    ACTIONS,
} from "react-joyride";

import type {
    CallBackProps,
    Step,
} from "react-joyride";


interface AppTourProps {
    run: boolean;
    steps: Step[];
    onFinish?: () => void;
}

export default function AppTour({
    run,
    steps,
    onFinish,
}: AppTourProps) {

    const handleCallback = (data: CallBackProps) => {
        const { status, action } = data;

        const finishedStatuses = [
            STATUS.FINISHED,
            STATUS.SKIPPED,
        ];

        if (
            finishedStatuses.includes(status) ||
            action === ACTIONS.CLOSE
        ) {
            onFinish?.();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            callback={handleCallback}
            continuous
            showProgress
            showSkipButton

            options={{
                primaryColor: "#000182",
                zIndex: 10000,
                backgroundColor: "#FFFFFF",
                textColor: "#374151",
                width: 420,
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

                overlay: {
                    backgroundColor: "rgba(5,0,88,0.55)",
                },
            }}
        />
    );
}