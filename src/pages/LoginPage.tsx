import { useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { Button } from "@/components/ui/button.tsx";

function LoginPage() {
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
    <>
      <div className="column is-6 is-offset-3">
        <div className="card">
          <div className="card-content">
            <p className="subtitle">
              To use the Fatbook app, please login with Google
            </p>
          </div>
          <footer className="card-footer">
            <p className="card-footer-item">
              <Button onClick={handleLogin}>
                <FaGoogle /> Login
              </Button>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
