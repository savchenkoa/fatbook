import { ReactNode } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

interface PageTitleProps {
  title?: string | null;
  subtitle?: string;
  backPath?: number;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function PageTitle({
  title,
  subtitle,
  backPath,
  children,
  className,
}: PageTitleProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center", className)}>
      {backPath && (
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <FaChevronLeft />
        </Button>
      )}
      <div className="grow">
        <p className={cn("text-xl font-semibold")}>{title ?? "loading..."}</p>
        <p className="text-slate-500">{subtitle}</p>
      </div>
      <div className="">{children}</div>
    </div>
  );
}
