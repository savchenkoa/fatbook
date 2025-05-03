import { ReactNode } from "react";
import { LucideArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";

type Props = {
  children?: ReactNode;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  backRoute?: string | number;
  className?: string;
};
export function HeaderBox({
  children,
  title,
  subtitle,
  backRoute,
  className,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "bg-white p-4 shadow sm:mt-3 sm:rounded-xl sm:p-6!",
        className,
      )}
    >
      {title || backRoute ? (
        <div className="mb-4 flex items-center justify-center">
          {backRoute && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(backRoute as string)}
              className="text-accent-foreground size-10 rounded-full"
            >
              <LucideArrowLeft className="size-6" />
            </Button>
          )}
          {title && (
            <>
              <div className="mr-[56px] grow text-center">
                <h2 className="text-xl font-bold">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-slate-500">{subtitle}</p>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}
