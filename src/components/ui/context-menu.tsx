import { useIsTouchDevice } from "@/hooks/use-is-touch-device";

const NAVBAR_HEIGHT = 56;

type Props = {
    x: number;
    y: number;
    children?: React.ReactNode;
};

export function ContextMenu({ x, y, children }: Props) {
    const isTouchDevice = useIsTouchDevice();
    const xOffset = isTouchDevice ? document.body.scrollWidth / 2 - 100 : x;
    const yOffset = y - NAVBAR_HEIGHT;
    return (
        <div
            className="absolute"
            style={{
                left: xOffset,
                top: yOffset,
                width: 200,
            }}
        >
            <div className="w-40" role="menu">
                <div className="rounded-xl border-1 bg-white p-2 shadow-lg">{children}</div>
            </div>
        </div>
    );
}

type ContextMenuItemProps = {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
};

export function ContextMenuItem({ icon, children, onClick }: ContextMenuItemProps) {
    return (
        <span
            className="text-accent-foreground hover:bg-accent flex cursor-pointer items-center rounded-xl p-4"
            style={{ height: 50 }}
            onClick={onClick}
        >
            <span className="mr-3 text-slate-400">{icon}</span>
            <span>{children}</span>
        </span>
    );
}
