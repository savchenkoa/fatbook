import { Button } from "@/components/ui/button";
import { LucideHelpCircle } from "lucide-react";
import { useState } from "react";
import { SimpleTutorial } from "@/components/ui/simple-tutorial";
import { getTutorialSteps } from "@/utils/tutorial-steps";

interface RestartTutorialButtonProps {
    variant?: "default" | "outline" | "ghost" | "secondary" | "link";
    size?: "sm" | "default" | "lg";
    className?: string;
}

export function RestartTutorialButton({ variant = "outline", size = "default", className }: RestartTutorialButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleShowTutorial = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                type="button"
                className={variant === "link" ? "text-white hover:bg-gray-700" : className}
                onClick={handleShowTutorial}
                title="Show tutorial"
            >
                {variant === "link" ? (
                    <LucideHelpCircle className="size-5" />
                ) : (
                    <>
                        <LucideHelpCircle className="mr-2 size-4" />
                        Show Tutorial
                    </>
                )}
            </Button>
            
            <SimpleTutorial
                steps={getTutorialSteps()}
                isOpen={isOpen}
                onClose={handleClose}
            />
        </>
    );
}