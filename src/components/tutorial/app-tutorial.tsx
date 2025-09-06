import { useEffect, useState } from "react";
import { SimpleTutorial } from "@/components/ui/simple-tutorial";
import { useSimpleTutorial } from "@/hooks/use-simple-tutorial";
import { getTutorialSteps } from "@/utils/tutorial-steps";

const GENERAL_TUTORIAL_ID = "app-intro";

export function AppTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const { completeTutorial, isTutorialCompleted } = useSimpleTutorial();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isTutorialCompleted(GENERAL_TUTORIAL_ID)) {
                setIsOpen(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isTutorialCompleted]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleComplete = () => {
        completeTutorial(GENERAL_TUTORIAL_ID);
        setIsOpen(false);
    };

    return (
        <SimpleTutorial
            steps={getTutorialSteps()}
            isOpen={isOpen}
            onClose={handleClose}
            onComplete={handleComplete}
        />
    );
}
