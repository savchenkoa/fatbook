import { useNavigate, useRouteError } from "react-router-dom";
import { CloseButton } from "@/components/ui/close-button.tsx";

export function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  console.error(error);

  const handleCloseClick = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen flex-col items-center">
      <article className="mt-20 max-w-lg">
        <div className="text-accent-foreground flex items-center justify-between rounded-t-2xl bg-red-300 p-6 text-lg font-semibold">
          <p>Sorry, an unexpected error has occurred.</p>
          <CloseButton onClick={handleCloseClick} />
        </div>
        <div className="rounded-b-2xl bg-red-100 p-6">
          {error.statusText || error.message}
        </div>
      </article>
    </div>
  );
}
