import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { GoogleIcon } from "@/features/auth/components/google-icon.tsx";
import { TestLoginForm } from "@/features/auth/components/test-login-form.tsx";

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
      <Box className="mx-4 mt-20 max-w-xl p-0">
        <div className="p-8 text-lg">
          Please login with Google to use Fatbook
        </div>
        <Separator />
        <div className="p-4 text-center">
          <Button
            onClick={handleLogin}
            variant="secondary"
            className="px-10! text-lg"
          >
            <GoogleIcon className="mr-1 size-5" /> Login
          </Button>
        </div>

        {/* Test Login Form - only visible in dev mode */}
        <div className="p-4">
          <TestLoginForm />
        </div>
      </Box>
    </div>
  );
}
