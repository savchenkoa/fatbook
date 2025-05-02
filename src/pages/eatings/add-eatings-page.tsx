import SelectDishPortionsForm from "@/components/dish-portions-form/SelectDishPortionsForm";
import { isToday, isYesterday } from "@/utils/date-utils";
import { useParams } from "react-router-dom";
import { DishPortion } from "@/types/dish-portion";
import { useEatingMutations } from "@/hooks/use-eating-mutations";
import AppLayout from "@/components/AppLayout.tsx";

function AddEatingsPage() {
  const { day, meal } = useParams();
  const { addEating, updateEating, removeEating, selectedPortions } =
    useEatingMutations(meal!);

  const handleAddEating = async (portion: DishPortion) => {
    addEating.mutate(portion);
  };

  const handleUpdateEatings = async (portion: DishPortion) => {
    updateEating.mutate(portion);
  };

  const handleDeleteEatings = async (portion: DishPortion) => {
    removeEating.mutate(portion);
  };

  const getSubtitle = () => {
    if (isToday(day)) {
      return `${meal}, Today`;
    }

    if (isYesterday(day)) {
      return `${meal}, Yesterday`;
    }

    return `${meal}, ${day}`;
  };

  return (
    <AppLayout>
      <SelectDishPortionsForm
        title="Select Dish"
        selectedPortions={selectedPortions}
        subtitle={getSubtitle()}
        onAdd={handleAddEating}
        onUpdate={handleUpdateEatings}
        onDelete={handleDeleteEatings}
      />
    </AppLayout>
  );
}

export default AddEatingsPage;
