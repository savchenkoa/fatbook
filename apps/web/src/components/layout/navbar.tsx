import { NavLink } from "react-router-dom";
import { NavbarUser } from "./navbar-user.tsx";
import { ThemeSwitcher } from "./theme-switcher.tsx";
import { FatbookLogo } from "@/components/ui/fatbook-logo.tsx";
import { RestartTutorialButton } from "@/components/tutorial/restart-tutorial-button.tsx";
import { cn } from "@/lib/utils";

export function Navbar() {
    const getNavLinkClass = ({ isActive }) =>
        cn("hover:bg-zinc-800 px-5 py-4 text-white", {
            "bg-zinc-800": isActive,
        });

    return (
        <nav
            className="text-sidebar-primary-foreground hidden h-14 items-center bg-zinc-700 px-4 sm:flex dark:bg-zinc-900"
            role="navigation"
            aria-label="main navigation"
        >
            <a className="flex items-center gap-3 px-5 py-4" href="/">
                <FatbookLogo />
                <h1 className="text-sidebar-primary-foreground ml-2 text-2xl font-bold">Fatbook</h1>
            </a>

            <div className="flex grow items-center">
                <NavLink to="eatings" className={getNavLinkClass}>
                    Eatings
                </NavLink>
                <NavLink to="dishes" className={getNavLinkClass}>
                    Dishes
                </NavLink>
                <NavLink to="insights" className={getNavLinkClass}>
                    Insights
                </NavLink>
                <NavLink to="account" className={getNavLinkClass}>
                    Account
                </NavLink>
            </div>

            <div className="flex items-center gap-5">
                <RestartTutorialButton variant="link" size="sm" />
                <ThemeSwitcher />
                <NavbarUser />
            </div>
        </nav>
    );
}
