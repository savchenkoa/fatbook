import { MouseEventHandler, useEffect, useState } from "react";

export function useContextMenu() {
    const [isOpened, setOpened] = useState(false);
    const [clickLocation, setClickLocation] = useState({
        x: 0,
        y: 0,
    });

    useEffect(() => {
        const handleClick = () => setOpened(false);
        window.addEventListener("click", handleClick);
        return () => {
            window.removeEventListener("click", handleClick);
        };
    }, []);

    const openContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        setOpened(true);
        setClickLocation({
            x: e.pageX,
            y: e.pageY,
        });
    };

    return {
        isOpened,
        clickLocation,
        openContextMenu,
    };
}
