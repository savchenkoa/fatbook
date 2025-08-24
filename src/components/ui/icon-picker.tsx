import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { useEffect, useState } from "react";
import { LucidePencilLine } from "lucide-react";
import { flushSync } from "react-dom";

type Props = {
    value?: string | null;
    disabled?: boolean;
    onSubmit?: () => void;
};

export function IconPicker({ value, disabled, onSubmit }: Props) {
    const [localValue, setLocalValue] = useState(value ?? "🥫");

    useEffect(() => {
        setLocalValue(value ?? "🥫");
    }, [value]);

    const handleEmojiClick = (emoji: string) => {
        flushSync(() => {
            setLocalValue(emoji);
        });
        onSubmit?.();
    };

    return (
        <>
            <input type="hidden" name="icon" value={localValue} />
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled}
                        className="group relative size-20 rounded-xl border bg-linear-to-bl from-indigo-300 via-purple-300 to-pink-300 text-5xl transition-all hover:scale-105 sm:size-24 sm:text-7xl"
                    >
                        {localValue}
                        <span className="absolute right-0 bottom-0 hidden translate-x-1/6 translate-y-1/6 rounded-full border-1 border-gray-500 bg-white p-1.5 text-gray-400 group-hover:inline group-focus:inline">
                            <LucidePencilLine />
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col rounded-none border-none bg-white p-4 sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="flex gap-2">Select Icon</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pb-6">
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {emojis.map(([emoji, label]) => (
                                <DialogTrigger asChild key={emoji}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="size-14 p-0 text-4xl sm:text-5xl"
                                        title={label}
                                        onClick={() => handleEmojiClick(emoji)}
                                    >
                                        {emoji}
                                    </Button>
                                </DialogTrigger>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="px-14">
                                Close
                            </Button>
                        </DialogTrigger>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

const emojis = [
    ["🍇", "grape"],
    ["🍈", "melon"],
    ["🍉", "watermelon"],
    ["🍊", "tangerine"],
    ["🍋", "lemon"],
    ["🍌", "banana"],
    ["🍍", "pineapple"],
    ["🥭", "mango"],
    ["🍎", "apple"],
    ["🍏", "green apple"],
    ["🍐", "pear"],
    ["🍑", "peach"],
    ["🍒", "cherries"],
    ["🍓", "strawberry"],
    ["🫐", "blueberries"],
    ["🥝", "kiwi fruit"],
    ["🍅", "tomato"],
    ["🫒", "olive"],
    ["🥥", "coconut"],
    ["🥑", "avocado"],
    ["🍆", "eggplant"],
    ["🥔", "potato"],
    ["🥕", "carrot"],
    ["🌽", "corn"],
    ["🌶", "hot pepper"],
    ["🫑", "bell pepper"],
    ["🥒", "cucumber"],
    ["🥬", "leafy green"],
    ["🥦", "broccoli"],
    ["🧄", "garlic"],
    ["🧅", "onion"],
    ["🍄", "mushroom"],
    ["🥜", "peanuts"],
    ["🫘", "beans"],
    ["🌰", "chestnut"],
    ["🍞", "bread"],
    ["🥐", "croissant"],
    ["🥖", "baguette bread"],
    ["🫓", "flatbread"],
    ["🥨", "pretzel"],
    ["🥯", "bagel"],
    ["🥞", "pancakes"],
    ["🧇", "waffle"],
    ["🧀", "cheese wedge"],
    ["🐄", "cow"],
    ["🐖", "pig"],
    ["🐑", "sheep"],
    ["🐓", "chicken"],
    ["🦃", "turkey"],
    ["🦆", "duck"],
    ["🍖", "meat on bone"],
    ["🍗", "poultry leg"],
    ["🥩", "cut of meat"],
    ["🥓", "bacon"],
    ["🍔", "hamburger"],
    ["🍟", "french fries"],
    ["🍕", "pizza"],
    ["🌭", "hot dog"],
    ["🥪", "sandwich"],
    ["🌮", "taco"],
    ["🌯", "burrito"],
    ["🫔", "tamale"],
    ["🥙", "stuffed flatbread"],
    ["🧆", "falafel"],
    ["🥚", "egg"],
    ["🍳", "cooking"],
    ["🥘", "shallow pan of food"],
    ["🍲", "pot of food"],
    ["🫕", "fondue"],
    ["🥣", "bowl with spoon"],
    ["🥗", "green salad"],
    ["🍿", "popcorn"],
    ["🧈", "butter"],
    ["🧂", "salt"],
    ["🥫", "canned food"],
    ["🍱", "bento box"],
    ["🍘", "rice cracker"],
    ["🍙", "rice ball"],
    ["🍚", "cooked rice"],
    ["🍛", "curry rice"],
    ["🍜", "steaming bowl"],
    ["🍝", "spaghetti"],
    ["🍠", "roasted sweet potato"],
    ["🍢", "oden"],
    ["🍣", "sushi"],
    ["🍤", "fried shrimp"],
    ["🍥", "fish cake with swirl"],
    ["🥮", "moon cake"],
    ["🍡", "dango"],
    ["🥟", "dumpling"],
    ["🥠", "fortune cookie"],
    ["🥡", "takeout box"],
    ["🦀", "crab"],
    ["🦞", "lobster"],
    ["🦐", "shrimp"],
    ["🦑", "squid"],
    ["🦪", "oyster"],
    ["🍦", "soft ice cream"],
    ["🍧", "shaved ice"],
    ["🍨", "ice cream"],
    ["🍩", "doughnut"],
    ["🍪", "cookie"],
    ["🎂", "birthday cake"],
    ["🍰", "shortcake"],
    ["🧁", "cupcake"],
    ["🥧", "pie"],
    ["🍫", "chocolate bar"],
    ["🍬", "candy"],
    ["🍭", "lollipop"],
    ["🍮", "custard"],
    ["🍯", "honey pot"],
    ["🍼", "baby bottle"],
    ["🥛", "glass of milk"],
    ["☕", "hot beverage"],
    ["🫖", "teapot"],
    ["🍵", "teacup without handle"],
    ["🍶", "sake"],
    ["🍾", "bottle with popping cork"],
    ["🍷", "wine glass"],
    ["🍸", "cocktail glass"],
    ["🍹", "tropical drink"],
    ["🍺", "beer mug"],
    ["🍻", "clinking beer mugs"],
    ["🥂", "clinking glasses"],
    ["🥃", "tumbler glass"],
    ["🫗", "pouring liquid"],
    ["🥤", "cup with straw"],
    ["🧋", "bubble tea"],
    ["🧃", "beverage box"],
    ["🧉", "mate"],
    ["🧊", "ice"],
    ["🥢", "chopsticks"],
    ["🍽", "fork and knife with plate"],
    ["🍴", "fork and knife"],
    ["🥄", "spoon"],
];
