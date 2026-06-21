import { useAuth } from "@/context/auth.tsx";
import { UserAvatar } from "@/components/ui/user-avatar.tsx";

export function NavbarUser() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const avatarUrl = user.user_metadata?.avatar_url;
    const displayName = user.user_metadata?.name
        ? user.user_metadata.name.split(" ")[0]
        : user.email;

    return (
        <div className="flex items-center gap-2">
            <UserAvatar avatarUrl={avatarUrl} />
            <div>{displayName}</div>
        </div>
    );
}
