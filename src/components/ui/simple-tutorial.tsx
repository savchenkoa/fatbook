import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { Link } from "react-router-dom";
import {
    LucideX,
    LucideArrowRight,
    LucideArrowLeft,
    LucideUtensils,
    LucideCalendar,
    LucideTrendingUp,
} from "lucide-react";

const iconMap = {
    utensils: LucideUtensils,
    calendar: LucideCalendar,
    "trending-up": LucideTrendingUp,
};

export interface SimpleTutorialStep {
    title: string;
    content: ReactNode;
    action?: {
        text: string;
        href: string;
        icon?: keyof typeof iconMap;
    };
}

interface SimpleTutorialProps {
    steps: SimpleTutorialStep[];
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export function SimpleTutorial({ steps, isOpen, onClose, onComplete }: SimpleTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        setCurrentStep(0);
    }, [steps]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete?.();
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = steps[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Box className="bg-background w-full max-w-md rounded-lg border p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-foreground text-lg font-semibold">
                        {currentStepData.title}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={onClose}
                        className="text-foreground hover:text-foreground"
                    >
                        <LucideX className="size-4" />
                    </Button>
                </div>

                <div className="text-foreground mb-6 text-sm">{currentStepData.content}</div>

                {currentStepData.action && (
                    <div className="mb-4">
                        <Button variant="secondary" asChild className="w-full">
                            <Link to={currentStepData.action.href}>
                                {currentStepData.action.icon &&
                                    (() => {
                                        const IconComponent = iconMap[currentStepData.action.icon];
                                        return <IconComponent className="size-4" />;
                                    })()}
                                {currentStepData.action.text}
                            </Link>
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-3 w-3 rounded-full transition-all duration-200 ${
                                    index === currentStep
                                        ? "bg-primary scale-125 shadow-sm"
                                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={handlePrevious}
                                className="text-foreground hover:text-foreground"
                            >
                                <LucideArrowLeft className="mr-1 size-3" />
                                Previous
                            </Button>
                        )}
                        <Button variant="default" size="sm" type="button" onClick={handleNext}>
                            {currentStep < steps.length - 1 ? (
                                <>
                                    Next
                                    <LucideArrowRight className="ml-1 size-3" />
                                </>
                            ) : (
                                "Finish"
                            )}
                        </Button>
                    </div>
                </div>
            </Box>
        </div>
    );
}
