import { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type Props = {
  children: ReactNode;
  className: string;
};

export function Box({ children, className }: Props) {
  return (
    <div
      className={cn("mx-5 rounded-xl bg-white p-4 shadow sm:mx-0", className)}
    >
      {children}
    </div>
  );
}
