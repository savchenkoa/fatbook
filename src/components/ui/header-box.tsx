import { ReactNode } from "react";
import { LucideArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";

type Props = {
  children?: ReactNode;
  title?: string | ReactNode;
  backRoute?: string;
  className?: string;
};
export function HeaderBox({ children, title, backRoute, className }: Props) {
  return (
    <div
      className={cn(
        "bg-white p-4 shadow sm:mt-3 sm:rounded-xl sm:p-6!",
        className,
      )}
    >
      {title || backRoute ? (
        <div className="mb-6 flex items-center justify-center">
          {backRoute && (
            <Link
              to={backRoute}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 active:bg-slate-300 sm:p-4"
            >
              <LucideArrowLeft />
            </Link>
          )}
          {title && (
            <h1 className="mr-[56px] grow text-center text-xl font-bold">
              {title}
            </h1>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}
