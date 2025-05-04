import { HeaderBox } from "@/components/ui/header-box.tsx";
import { AppLayout } from "@/components/app-layout.tsx";

export function AboutPage() {
  return (
    <AppLayout>
      <HeaderBox title="About" backRoute="/account">
        <div className="mb-4 text-center">
          <strong>Fatbook</strong> by{" "}
          <a
            href="https://github.com/sketchyy"
            title="github"
            target="_blank"
            rel="noreferrer"
          >
            sketchyy
          </a>
        </div>

        <p className="mb-2 text-center">
          Following art assets are used in this app:
        </p>

        <ul className="text-center">
          <li>
            <a
              href="https://www.flaticon.com/free-icons/plate"
              title="plate icons"
              target="_blank"
              rel="noreferrer"
            >
              Plate icons created by Freepik - Flaticon
            </a>
          </li>
          <li>
            <a
              href="https://www.flaticon.com/free-icons/food"
              title="food icons"
              target="_blank"
              rel="noreferrer"
            >
              Food icons created by Freepik - Flaticon
            </a>
          </li>
        </ul>
      </HeaderBox>
    </AppLayout>
  );
}
