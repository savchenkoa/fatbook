import { useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { Button } from "@/components/ui/button.tsx";
import Box from "@/components/ui/Box.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Try without useEffect
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  });

  const handleLogin = async () => {
    const { error } = await signIn();

    if (error) {
      alert("Error signing in");
      console.error("Error signing in:", error);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex h-screen items-baseline justify-center text-center">
      <Box className="mt-20 max-w-xl p-0">
        <div className="p-8 text-lg">
          Please login with Google to use Fatbook
        </div>
        <Separator />
        <div className="p-4 text-center">
          <Button onClick={handleLogin}>
            <FaGoogle /> Login
          </Button>
        </div>
      </Box>
    </div>
  );
}
