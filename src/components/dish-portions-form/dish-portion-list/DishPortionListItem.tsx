import { useRef, useState } from "react";
import { FaCheck, FaPlus, FaTimes } from "react-icons/fa";
import { Form, useLocation, useNavigate } from "react-router-dom";
import { DishPortion } from "@/types/dish-portion";
import { Button } from "@/components/ui/button.tsx";
import { LucideExternalLink } from "lucide-react";

type Props = {
  focused: boolean;
  dishPortion: DishPortion;
  onAdd: (p: DishPortion) => void;
  onUpdate: (p: DishPortion) => void;
  onDelete: (p: DishPortion) => void;
  isAdded: (p: DishPortion) => boolean;
};

export function DishPortionListItem({
  focused,
  dishPortion,
  onAdd,
  onUpdate,
  onDelete,
  isAdded,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [size, setSize] = useState<number | undefined>(
    dishPortion.portion ?? dishPortion.dish.defaultPortion ?? undefined,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e) => {
    setSize(e.target.value);
  };

  const handleAddClick = () => {
    onAdd({ ...dishPortion, portion: Number(size) });
  };

  const handleUpdateClick = () => {
    onUpdate({ ...dishPortion, portion: Number(size) });
  };

  const handleDeleteClick = () => {
    setSize(dishPortion.dish.defaultPortion ?? undefined);
    onDelete(dishPortion);
  };

  const handleOpenDishClick = () => {
    navigate(`/dishes/${dishPortion.dish.id}/edit`, {
      state: { backUrl: location.pathname },
    });
  };

  if (inputRef.current && focused) {
    inputRef.current.focus();
  }

  return (
    <div className="px-4 pb-4">
      <Form onSubmit={(e) => e.preventDefault()}>
        <div className="is-flex is-align-items-end">
          <div className="is-flex is-flex-direction-column is-gap-1">
            {isAdded(dishPortion) && (
              <Button
                type="button"
                variant="destructive"
                className="mr-3"
                onClick={handleDeleteClick}
              >
                <FaTimes />
              </Button>
            )}
          </div>
          <div className="is-flex-grow-1">
            <div className="field">
              <div className="is-flex is-gap-1 is-justify-content-space-between is-align-items-center">
                <label className="label">Portion (g.)</label>
                <Button
                  type="button"
                  variant="link"
                  className="text-accent-foreground mb-2 p-0"
                  onClick={handleOpenDishClick}
                >
                  Open <LucideExternalLink />
                </Button>
              </div>
              <p className="control">
                <input
                  ref={inputRef}
                  name="servingSize"
                  className="input"
                  type="number"
                  placeholder="g."
                  value={size}
                  onChange={handleInputChange}
                />
              </p>
            </div>
          </div>
          {!isAdded(dishPortion) && (
            <Button className="ml-3" onClick={() => handleAddClick()}>
              <FaPlus />
            </Button>
          )}
          {isAdded(dishPortion) && (
            <Button className="ml-3" onClick={() => handleUpdateClick()}>
              <FaCheck />
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
