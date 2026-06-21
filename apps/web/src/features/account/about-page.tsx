import { HeaderBox } from "@/components/ui/header-box.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { FatbookLogo } from "@/components/ui/fatbook-logo.tsx";

export function AboutPage() {
    return (
        <AppLayout>
            <HeaderBox backRoute="/account">
                <div className="flex flex-col items-center">
                    <div className="group mb-4 [perspective:1000px]">
                        <FatbookLogo className="preserve-3d size-16 rounded-lg shadow-lg transition duration-500 ease-in-out group-hover:-translate-y-4 group-hover:scale-110 group-hover:[transform:rotateY(15deg)_rotateX(10deg)] group-hover:shadow-2xl group-[.is-active]:-translate-y-4 group-[.is-active]:scale-110 group-[.is-active]:[transform:rotateY(15deg)_rotateX(10deg)] group-[.is-active]:shadow-2xl" />
                    </div>
                    <div className="mb-10 text-center">
                        <strong>Fatbook</strong> by{" "}
                        <a
                            href="https://github.com/sketchyy"
                            title="github"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            sketchyy
                        </a>
                    </div>
                </div>

                <p className="mb-2 text-center">Following art assets are used in this app:</p>

                <ul className="text-center">
                    <li>
                        <a
                            href="https://www.flaticon.com/free-icons/plate"
                            title="plate icons"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
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
                            className="text-blue-600 hover:underline"
                        >
                            Food icons created by Freepik - Flaticon
                        </a>
                    </li>
                </ul>
            </HeaderBox>
        </AppLayout>
    );
}
