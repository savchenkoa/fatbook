import { Box } from "@/components/ui/box-new";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { useAuth } from "@/context/Auth.tsx";
import {
  LucideChevronRight,
  LucideGoal,
  LucideInfo,
  LucideLogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator.tsx";

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
    <div className="mx-auto max-w-xl">
      <HeaderBox>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-12">
          <img className="size-16 rounded-full" src={avatarUrl} alt="" />
          <div>
            <div className="text-2xl">Hello, {displayName}! 👋</div>
            <div className="text-md text-slate-500">{email}</div>
          </div>
        </div>
      </HeaderBox>
      <Box className="mx-5 mt-5">
        <div className="flex flex-col gap-2">
          <Link
            to="goals"
            className="flex gap-2 rounded-xl p-4 text-black hover:bg-slate-100 active:bg-slate-200"
          >
            <LucideGoal className="text-gray-400" />
            <span className="grow">Set daily goals</span>
            <LucideChevronRight />
          </Link>
          <Link
            to="about"
            className="flex gap-2 rounded-xl p-4 text-black hover:bg-slate-100 active:bg-slate-200"
          >
            <LucideInfo className="text-gray-400" />
            <span className="grow">About</span>
            <LucideChevronRight />
          </Link>
          <Separator />
          <button
            className="flex gap-2 rounded-xl p-4 text-red-600 hover:bg-slate-100 active:bg-slate-200"
            onClick={handleLogout}
          >
            <LucideLogOut className="text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </Box>
    </div>
  );
}
