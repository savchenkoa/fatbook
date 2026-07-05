import type { DishPortion } from "@fatbook/shared";
import { getDishIcon } from "../utils/dish-icon";
import { EditValueSheet } from "./EditValueSheet";

const STEP = 10;

type Props = {
    visible: boolean;
    dishPortion: DishPortion | null;
    isEditing?: boolean;
    onClose: () => void;
    onSubmit: (portion: DishPortion) => void;
    onDelete?: (portion: DishPortion) => void;
};

export function PortionEditorModal({
    visible,
    dishPortion,
    isEditing,
    onClose,
    onSubmit,
    onDelete,
}: Props) {
    if (!dishPortion) {
        return null;
    }

    const initial = dishPortion.portion ?? dishPortion.dish.defaultPortion ?? 100;

    const handleSave = (portion: number) => {
        onSubmit({ ...dishPortion, portion });
        onClose();
    };

    return (
        <EditValueSheet
            visible={visible}
            title={`${getDishIcon(dishPortion.dish)} ${dishPortion.dish.name}`}
            value={initial}
            unit="g"
            step={STEP}
            saveLabel={isEditing ? "Save" : "Add"}
            onSave={handleSave}
            onCancel={onClose}
            secondaryAction={
                isEditing && onDelete
                    ? {
                          label: "Delete",
                          destructive: true,
                          onPress: () => {
                              onDelete(dishPortion);
                              onClose();
                          },
                      }
                    : undefined
            }
        />
    );
}
