import { ReactNode } from "react";
import { LucideArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { HeaderTitle } from "@/components/ui/header-title.tsx";

type Props = {
  children?: ReactNode;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  action?: ReactNode;
  backRoute?: string | number;
  className?: string;
};
export function HeaderBox({
  children,
  title,
  subtitle,
  backRoute,
  action,
  className,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "bg-white p-4 shadow sm:mt-4 sm:rounded-xl sm:p-6!",
        className,
      )}
    >
      {title || backRoute ? (
        <div className="relative mb-8 flex min-h-10 items-center">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 transform">
            {backRoute && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate(backRoute as string)}
                className="text-accent-foreground size-10 rounded-full"
                aria-label="back"
              >
                <LucideArrowLeft className="size-6" />
              </Button>
            )}
          </div>
          {title && <HeaderTitle title={title} subtitle={subtitle} />}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 transform">
            {action}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
