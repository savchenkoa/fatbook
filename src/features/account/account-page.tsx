import { Box } from "@/components/ui/box.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { useAuth } from "@/context/auth.tsx";
import {
    LucideChevronRight,
    LucideGoal,
    LucideInfo,
    LucideLogOut,
    LucideHelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { UserAvatar } from "@/components/ui/user-avatar.tsx";
import { MobileThemeSwitcher } from "@/features/account/components/mobile-theme-switcher.tsx";
import { useState } from "react";
import { SimpleTutorial } from "@/components/ui/simple-tutorial";
import { getTutorialSteps } from "@/utils/tutorial-steps";

export function AccountPage() {
    const { user, signOut } = useAuth();
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        const confirmation = confirm("Are you sure you want to log out?");
        if (confirmation) {
            signOut();
        }
    };

    const avatarUrl = user.user_metadata?.avatar_url;
    const displayName = user.user_metadata?.name
        ? user.user_metadata.name.split(" ")[0]
        : user.email;
    const email = displayName ? user.email : undefined;

    return (
        <AppLayout>
            <HeaderBox className="mb-4">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-12">
                    <UserAvatar avatarUrl={avatarUrl} variant="large" color="dark" />
                    <div>
                        <div className="text-foreground text-2xl">Hello, {displayName}! 👋</div>
                        <div className="text-md text-muted-foreground">{email}</div>
                    </div>
                </div>
            </HeaderBox>
            <Box className="mx-5">
                <div className="flex flex-col gap-2">
                    <Link
                        to="goals"
                        className="text-foreground hover:bg-accent active:bg-accent/80 flex gap-2 rounded-xl p-4"
                    >
                        <LucideGoal className="text-muted-foreground" />
                        <span className="grow">Set daily goals</span>
                        <LucideChevronRight />
                    </Link>
                    <Link
                        to="about"
                        className="text-foreground hover:bg-accent active:bg-accent/80 flex gap-2 rounded-xl p-4"
                    >
                        <LucideInfo className="text-muted-foreground" />
                        <span className="grow">About</span>
                        <LucideChevronRight />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsTutorialOpen(true)}
                        className="text-foreground hover:bg-accent active:bg-accent/80 flex gap-2 rounded-xl p-4"
                    >
                        <LucideHelpCircle className="text-muted-foreground" />
                        <span>Show Tutorial</span>
                    </button>
                    <Separator className="sm:hidden" />
                    <MobileThemeSwitcher />
                    <Separator />
                    <button
                        className="hover:bg-accent active:bg-accent/80 flex gap-2 rounded-xl p-4 text-red-600 dark:text-red-400"
                        onClick={handleLogout}
                    >
                        <LucideLogOut className="text-red-400" />
                        <span>Logout</span>
                    </button>
                </div>
            </Box>

            <SimpleTutorial
                steps={getTutorialSteps()}
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />
        </AppLayout>
    );
}
