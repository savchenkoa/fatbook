import { useAuth } from "@/context/Auth";

function NavbarUser() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.name
    ? user.user_metadata.name.split(" ")[0]
    : user.email;

  return (
    <div className="flex gap-2">
      <img className="size-7 rounded-full" src={avatarUrl} alt="" />
      <div>{displayName}</div>
    </div>
  );
}

export default NavbarUser;
