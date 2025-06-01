import { useState } from "react";
import { useAuth } from "@/context/auth.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { LucideTestTube } from "lucide-react";

export function TestLoginForm() {
  const { signInWithEmailPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show in dev mode
  if (import.meta.env.PROD) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signInWithEmailPassword(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Test login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Separator className="my-4" />
      <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4">
        <div className="mb-4 flex items-center gap-2 text-orange-700">
          <LucideTestTube className="size-4" />
          <span className="text-sm font-medium">Test Login (Dev Only)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="test-email">Email</Label>
            <Input
              id="test-email"
              data-testid="test-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="test-password">Password</Label>
            <Input
              id="test-password"
              data-testid="test-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            data-testid="test-login-button"
            disabled={isLoading || !email || !password}
            className="w-full"
            variant="outline"
          >
            {isLoading ? "Signing in..." : "Test Login"}
          </Button>
        </form>
      </div>
    </>
  );
}
