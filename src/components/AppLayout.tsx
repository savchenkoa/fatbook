import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};
export function AppLayout({ children, className }: Props) {
  return (
    <div className={cn("sm:mx-auto sm:max-w-xl", className)}>{children}</div>
  );
}
