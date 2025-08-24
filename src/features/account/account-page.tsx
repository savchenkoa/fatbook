import { Box } from "@/components/ui/box.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { useAuth } from "@/context/auth.tsx";
import { LucideChevronRight, LucideGoal, LucideInfo, LucideLogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { UserAvatar } from "@/components/ui/user-avatar.tsx";

export function AccountPage() {
    const { user, signOut } = useAuth();

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
                        <div className="text-2xl text-foreground">Hello, {displayName}! 👋</div>
                        <div className="text-md text-muted-foreground">{email}</div>
                    </div>
                </div>
            </HeaderBox>
            <Box className="mx-5">
                <div className="flex flex-col gap-2">
                    <Link
                        to="goals"
                        className="flex gap-2 rounded-xl p-4 text-foreground hover:bg-accent active:bg-accent/80"
                    >
                        <LucideGoal className="text-muted-foreground" />
                        <span className="grow">Set daily goals</span>
                        <LucideChevronRight />
                    </Link>
                    <Link
                        to="about"
                        className="flex gap-2 rounded-xl p-4 text-foreground hover:bg-accent active:bg-accent/80"
                    >
                        <LucideInfo className="text-muted-foreground" />
                        <span className="grow">About</span>
                        <LucideChevronRight />
                    </Link>
                    <Separator />
                    <button
                        className="flex gap-2 rounded-xl p-4 text-red-600 dark:text-red-400 hover:bg-accent active:bg-accent/80"
                        onClick={handleLogout}
                    >
                        <LucideLogOut className="text-red-400" />
                        <span>Logout</span>
                    </button>
                </div>
            </Box>
        </AppLayout>
    );
}
