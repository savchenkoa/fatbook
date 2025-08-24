import { useAuth } from "@/context/auth.tsx";
import { LucideRocket, LucideInfo } from "lucide-react";

export function DemoBanner() {
    const { user } = useAuth();

    if (!user || user.email !== import.meta.env.VITE_DEMO_USER_EMAIL) {
        return null;
    }

    return (
        <div className="border-b border-green-300 bg-gradient-to-r from-green-100 to-green-200 p-2 text-center">
            <div className="flex items-center justify-center gap-2 text-green-800">
                <LucideRocket className="size-4" />
                <span className="text-sm font-medium">
                    Demo Mode - Changes won't be saved permanently
                </span>
                <LucideInfo className="size-4" />
            </div>
        </div>
    );
}
