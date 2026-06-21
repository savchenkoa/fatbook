import { FatbookLogo } from "@/components/ui/fatbook-logo.tsx";
import { Link } from "react-router-dom";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device.ts";
import { ReactNode } from "react";

type Props = {
    title?: string | ReactNode;
    subtitle?: string | ReactNode;
};

export function HeaderTitle({ title, subtitle }: Props) {
    const isMobile = useIsTouchDevice();

    if (isMobile && title) {
        return (
            <div className="mx-auto text-center">
                <Link to="/">
                    <span className="flex gap-2 sm:hidden">
                        <FatbookLogo />
                        <span className="text-xl font-bold">Fatbook</span>
                    </span>
                </Link>
                <p className="text-sm text-slate-500">{title}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto text-center">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
    );
}
