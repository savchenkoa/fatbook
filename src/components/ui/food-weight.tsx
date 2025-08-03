import { cn } from "@/lib/utils.ts";

type Props = {
  value?: number | null;
  className?: string;
};
export const FoodWeight = ({ value, className }: Props) => {
  if (!value) {
    return null;
  }

  return (
    <strong className={cn("text-xs whitespace-nowrap", className)}>
      ⚖️ {value} g.
    </strong>
  );
};
