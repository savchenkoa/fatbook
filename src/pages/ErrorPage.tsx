import { useNavigate, useRouteError } from "react-router-dom";
import { CloseButton } from "@/components/ui/close-button.tsx";

export default function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  console.error(error);

  const handleCloseClick = () => {
    navigate("/");
  };

  return (
    <div className="columns is-centered is-mobile">
      <div className="column is-6-desktop is-12-mobile">
        <article className="box message is-danger mx-4 mt-4 p-0">
          <div className="message-header">
            <p>Sorry, an unexpected error has occurred.</p>
            <CloseButton onClick={handleCloseClick} />
          </div>
          <div className="message-body">
            {error.statusText || error.message}
          </div>
        </article>
      </div>
    </div>
  );
}
