import { PropsWithChildren } from "react";
import { CloseButton } from "@/components/ui/close-button.tsx";
import { LucideInfo } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
    title?: string;
    onClose?: () => void;
    className?: string;
}

export function Message({
    title,
    onClose,
    children,
    className = "",
}: PropsWithChildren<MessageProps>) {
    return (
        <div className={cn("flex items-start gap-3 rounded-xl bg-blue-50 p-4 sm:p-6", className)}>
            <LucideInfo />
            <div className="grow">
                {title && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="grow font-semibold">{title}</span>
                    </div>
                )}
                <div className="text-sm">{children}</div>
            </div>
            {onClose && <CloseButton onClick={onClose} />}
        </div>
    );
}
