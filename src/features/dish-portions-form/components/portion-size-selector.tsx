import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button.tsx";
import { DishPortion } from "@/types/dish-portion.ts";
import { Input } from "@/components/ui/input.tsx";
import { Info, LucideMinus, LucidePlus, LucideTrash } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { Link, useLocation } from "react-router-dom";

type Props = {
    open: boolean;
    onClose: () => void;
    dishPortion: DishPortion | null;
    isEditing?: boolean;
    onSubmit: (p: DishPortion) => void;
    onDelete?: (p: DishPortion) => void;
};

export function PortionSizeSelector({
    open,
    onClose,
    dishPortion,
    isEditing,
    onSubmit,
    onDelete,
}: Props) {
    const location = useLocation();
    const [portionSize, setPortionSize] = useState<number | undefined>(undefined);
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (dishPortion) {
            setPortionSize(dishPortion.portion ?? dishPortion.dish.defaultPortion ?? 100);
        }
    }, [dishPortion]);

    useEffect(() => {
        // Cleanup interval on unmount
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, []);

    if (!dishPortion) {
        return null;
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget.value) {
            setPortionSize(Number(e.currentTarget.value));
        } else {
            setPortionSize(undefined);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSubmitClick();
        }
    };

    const handleSubmitClick = () => {
        if (dishPortion) {
            onSubmit({ ...dishPortion, portion: Number(portionSize) });
            onClose();
        }
    };

    const handleDeleteClick = () => {
        onDelete?.(dishPortion);
        onClose();
    };

    const startIncrement = (increment: number) => {
        // First immediate change
        setPortionSize((prevValue) => {
            const newValue = (prevValue || 0) + increment;
            return newValue < 0 ? 0 : newValue;
        });

        startTimeRef.current = Date.now();

        // Clear any existing interval
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
        }

        // Start interval for continuous changes
        intervalRef.current = window.setInterval(() => {
            const elapsedTime = Date.now() - startTimeRef.current;

            // Increase speed after holding for a while
            let speed = 1;
            if (elapsedTime > 2000) {
                speed = 10;
            } else if (elapsedTime > 1000) {
                speed = 5;
            }

            setPortionSize((prevValue) => {
                const newValue = (prevValue || 0) + increment * speed;
                return newValue < 0 ? 0 : newValue;
            });
        }, 150);
    };

    const stopIncrement = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    return (
        <>
            <Drawer open={open} onClose={onClose} repositionInputs={false}>
                <DrawerContent className="mx-auto max-w-lg">
                    <DrawerHeader>
                        <DrawerTitle className="mb-4">
                            <div className="relative w-full text-center text-2xl">
                                <DishTitle dish={dishPortion.dish} className="justify-center" />
                                <Button
                                    className="absolute top-0 right-0 hover:bg-white"
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                >
                                    <Link
                                        to={`/dishes/${dishPortion.dish.id}`}
                                        state={{ backRoute: location.pathname }}
                                    >
                                        <Info />
                                    </Link>
                                </Button>
                            </div>
                        </DrawerTitle>
                        <DrawerDescription className="flex items-end justify-between gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-[50px] bg-white"
                                onMouseDown={() => startIncrement(-1)}
                                onMouseUp={stopIncrement}
                                onMouseLeave={stopIncrement}
                                onTouchStart={() => startIncrement(-1)}
                                onTouchEnd={stopIncrement}
                            >
                                <LucideMinus />
                            </Button>
                            <div className="flex-1">
                                <Label htmlFor="portion-size-input">Portion (g.)</Label>
                                <Input
                                    autoFocus
                                    type="number"
                                    id="portion-size-input"
                                    placeholder="gramm"
                                    className="mt-2 px-6 py-10 text-center text-4xl sm:py-6 sm:text-2xl"
                                    value={portionSize === undefined ? "" : portionSize}
                                    onChange={handleInputChange}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-[50px] bg-white"
                                onMouseDown={() => startIncrement(1)}
                                onMouseUp={stopIncrement}
                                onMouseLeave={stopIncrement}
                                onTouchStart={() => startIncrement(1)}
                                onTouchEnd={stopIncrement}
                            >
                                <LucidePlus />
                            </Button>
                        </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <div className="mt-4 flex items-center gap-4">
                            {isEditing && (
                                <Button
                                    onClick={handleDeleteClick}
                                    variant="outline"
                                    className="flex-1 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-500"
                                >
                                    <LucideTrash className="mr-2" /> Delete
                                </Button>
                            )}
                            <Button onClick={handleSubmitClick} className="flex-1">
                                {!isEditing && <LucidePlus className="mr-2" />}{" "}
                                {isEditing ? "Save" : "Add"}
                            </Button>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
