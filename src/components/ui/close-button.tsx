import { MouseEventHandler } from "react";
import { LucideX } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type Props = {
  onClick: MouseEventHandler;
};

export function CloseButton({ onClick }: Props) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="hover:bg-accent/30 rounded-full"
      aria-label="close"
      onClick={onClick}
    >
      <LucideX />
    </Button>
  );
}
