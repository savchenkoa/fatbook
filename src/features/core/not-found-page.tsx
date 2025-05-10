import { FaHome } from "react-icons/fa";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="flex h-screen flex-col justify-center">
      <div className="mb-80 text-center">
        <figure className="mr-auto ml-auto" style={{ width: 350, height: 350 }}>
          <img src="/404.png" alt="empty plate" />
        </figure>
        <p className="mb-4 text-4xl font-semibold">Page Not Found</p>
        <p className="mb-4 text-lg">
          Sorry, the page you are looking for could not be found.
        </p>
        <Button
          asChild
          variant="outline"
          className="text-accent-foreground bg-white"
        >
          <Link to="/">
            <FaHome />
            Home
          </Link>
        </Button>
      </div>
    </section>
  );
}
