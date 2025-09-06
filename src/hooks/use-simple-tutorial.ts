import { useState, useEffect } from "react";

const TUTORIAL_STORAGE_KEY = "fatbook-completed-tutorials";

export function useSimpleTutorial() {
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

    useEffect(() => {
        // Load completed tutorials from localStorage
        try {
            const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
            if (stored) {
                setCompletedTutorials(JSON.parse(stored));
            }
        } catch (error) {
            console.warn("Failed to load tutorial state:", error);
        }
    }, []);

    const completeTutorial = (tutorialId: string) => {
        const updated = [...completedTutorials, tutorialId];
        setCompletedTutorials(updated);
        try {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.warn("Failed to save tutorial state:", error);
        }
    };

    const isTutorialCompleted = (tutorialId: string) => {
        return completedTutorials.includes(tutorialId);
    };

    return {
        completeTutorial,
        isTutorialCompleted,
    };
}