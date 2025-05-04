import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function Box({ children, className, style }: Props) {
  return (
    <div
      className={cn("rounded-xl bg-white p-4 shadow sm:mx-0", className)}
      style={style}
    >
      {children}
    </div>
  );
}
