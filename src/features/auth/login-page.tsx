import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { GoogleIcon } from "@/features/auth/components/google-icon.tsx";
import { TestLoginForm } from "@/features/auth/components/test-login-form.tsx";
import { LucideEye } from "lucide-react";

const demoUser = {
    email: import.meta.env.VITE_DEMO_USER_EMAIL,
    password: import.meta.env.VITE_DEMO_USER_PASSWORD
};

export function LoginPage() {
    const { user, signIn, signInWithEmailPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";
    const [isDemoLoading, setIsDemoLoading] = useState(false);

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

    const handleDemoLogin = async () => {
        setIsDemoLoading(true);

        try {
            const { error } = await signInWithEmailPassword(demoUser.email, demoUser.password);

            if (error) {
                alert("Demo login error: " + error.message);
                console.error("Demo login error:", error);
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            alert("Demo login failed");
            console.error("Demo login failed:", err);
        } finally {
            setIsDemoLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-baseline justify-center text-center">
            <Box className="mx-4 mt-20 max-w-xl p-0">
                <div className="p-8 text-lg">Please login with Google to use Fatbook</div>
                <Separator />
                <div className="flex flex-col gap-4 p-4 text-center">
                    <Button onClick={handleLogin} variant="secondary" className="px-10! text-lg">
                        <GoogleIcon className="mr-1 size-5" /> Login
                    </Button>

                    {demoUser.email && demoUser.password && (
                        <>
                            <Button
                                onClick={handleDemoLogin}
                                disabled={isDemoLoading}
                                variant="outline"
                                className="border-green-300 px-10 text-lg text-green-700 hover:bg-green-50"
                            >
                                <LucideEye className="mr-2 size-5" />
                                {isDemoLoading ? "Loading Demo..." : "Try Demo"}
                            </Button>

                            <p className="mt-2 text-sm text-gray-500">
                                Demo mode lets you explore the app without using Google account
                            </p>
                        </>,
                    )}
                </div>

                {/* Test Login Form - only visible in dev mode */}
                <div className="p-4">
                    <TestLoginForm />
                </div>
            </Box>
        </div>
    );
}
