import React from "react";
import { Popover } from "react-tiny-popover";
import { clsx } from "clsx";
import { FaChevronDown } from "react-icons/fa";

type Props = {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
};
export default function EmojiPicker({ value, onChange, isLoading }: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const handleEmojiClick = (emoji: string) => {
    onChange(emoji);
    setIsPopoverOpen(!isPopoverOpen);
  };

  return (
    <Popover
      isOpen={isPopoverOpen}
      positions={["bottom", "left", "right"]}
      onClickOutside={() => setIsPopoverOpen(false)}
      content={() => (
        <div
          className="box is-flex is-flex-wrap-wrap is-gap-0.5 is-overflow-y-auto"
          style={{ width: "380px", height: "500px", maxWidth: "95vw" }}
        >
          {emojis.map(([emoji, label]) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="button is-white p-1"
              style={{ width: "40px", height: "40px", fontSize: "30px" }}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    >
      <button
        className={clsx("button", { "is-skeleton": isLoading })}
        style={{ width: 68 }}
        type="button"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        <span>{value}</span>
        <span className="icon">
          <FaChevronDown />
        </span>
      </button>
    </Popover>
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
  ["☕️", "hot beverage"],
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
  ["🥤", "cup with straw"],
  ["🧋", "bubble tea"],
  ["🧃", "beverage box"],
  ["🧉", "mate"],
];
