import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils.ts";

type Props = {
    id?: string;
    name: string;
    value?: string | number | null;
    type?: "text" | "number";
    placeholder?: string;
    prefix?: ReactNode;
    suffix?: ReactNode;
    className?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    ariaLabel?: string;
    onSubmit?: () => void;
};

export function InlineEdit({
    id,
    name,
    value,
    type = "text",
    placeholder,
    prefix,
    suffix,
    className,
    disabled,
    min,
    max,
    ariaLabel,
    onSubmit,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalValue(value?.toString() ?? "");
    }, [value]);

    const handleFocus = () => {
        if (disabled) return;
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onSubmit?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
            inputRef.current?.blur();
        }
        if (e.key === "Escape") {
            setLocalValue(value?.toString() ?? "");
            inputRef.current?.blur();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (type === "number" && newValue !== "") {
            const numValue = parseFloat(newValue);
            if (isNaN(numValue)) return;
            if (min !== undefined && numValue < min) return;
            if (max !== undefined && numValue > max) return;
        }

        setLocalValue(newValue);
    };

    const displayValue = localValue || placeholder;
    const showPlaceholder = !localValue && !isEditing;

    return (
        <div className="relative">
            <input
                id={id}
                ref={inputRef}
                type={type}
                name={name}
                aria-label={ariaLabel}
                placeholder={isEditing ? placeholder : undefined}
                value={isEditing ? localValue : displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                min={min}
                max={max}
                step="any"
                disabled={disabled}
                className={cn(
                    "min-h-9 w-full rounded-md border-2 px-2 py-1 transition-all outline-none",
                    // Read mode styling
                    !isEditing && [
                        "cursor-pointer border-transparent bg-transparent",
                        "hover:border-border hover:bg-accent",
                        showPlaceholder && "text-muted-foreground",
                        disabled && "cursor-not-allowed opacity-50",
                    ],
                    // Edit mode styling
                    isEditing && [
                        "cursor-text border-primary bg-background text-foreground",
                        "focus:ring-2 focus:ring-primary/20",
                    ],
                    className,
                )}
            />

            {!isEditing && (prefix || suffix) && (
                <>
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-muted-foreground sm:hidden">
                        {prefix}
                    </span>
                    <span
                        className="pointer-events-none absolute top-1/2 ml-2 -translate-y-1/2 transform text-muted-foreground sm:ml-0"
                        style={{ left: `calc(50% + ${(localValue.length || 1) * 0.6}ch)` }}
                    >
                        {suffix}
                    </span>
                </>
            )}
        </div>
    );
}
