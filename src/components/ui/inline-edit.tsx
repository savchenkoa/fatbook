import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils.ts";

type Props = {
  name: string;
  value?: string | number | null;
  type?: "text" | "number";
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  onSubmit?: () => void;
};

export function InlineEdit({
  name,
  value,
  type,
  placeholder,
  prefix,
  suffix,
  className,
  disabled,
  min,
  max,
  onSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalValue(value?.toString() ?? "");
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const submit = () => {
    onSubmit?.();
  };

  const handleEditClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setLocalValue(value?.toString() ?? "");
      setIsEditing(false);
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

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        name={name}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step="any"
        // disabled={isPending}
        className={cn(
          "w-full cursor-text! rounded-md border-2 border-blue-500 bg-white px-2 py-1 outline-none",
          "transition-all focus:ring-2 focus:ring-blue-200",
          // formState.errors?.[name] && "border-red-500 focus:ring-red-200",
          // isPending && "opacity-50",
          className,
        )}
      />
    );
  }

  return (
    <>
      <input name={name} type="hidden" value={localValue} />
      <button
        onClick={handleEditClick}
        onFocus={handleEditClick}
        className={cn(
          "group relative cursor-pointer rounded-md border-2 border-transparent px-2 py-1 transition-all",
          disabled && "cursor-not-allowed opacity-50",
          !localValue && "text-gray-400",
          // formState.errors?.[name] && "border-red-200 bg-red-50",
          // isPending && "pr-7!",
          className,
        )}
      >
        <span className={cn(prefix && "mr-2", "sm:hidden")}>{prefix}</span>
        {localValue || placeholder} {suffix}
      </button>
    </>
  );
}
