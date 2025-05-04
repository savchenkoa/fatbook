import { EditDishPortionsForm } from "@/components/dish-portions-form/edit-dish-portions-form.tsx";
import { PageTitle } from "@/components/page-title.tsx";
import { Confirm, Confirmation } from "@/components/ui/confirm.tsx";
import { useState } from "react";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Dish } from "@/types/dish";
import { DishPortion } from "@/types/dish-portion";
import { useIngredientMutations } from "@/hooks/use-ingredients-mutations";
import { DishIngredientsDetails } from "@/components/dish/dish-ingredients-details.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Box } from "@/components/ui/box-new";

export function IngredientsPage() {
  const navigate = useNavigate();
  const { dish, isDishShared } = useOutletContext<{
    dish: Dish;
    isDishShared: boolean;
  }>();
  const [showDetails, setShowDetails] = useState(false);
  const [confirm, setConfirm] = useState<Confirmation>({
    visible: false,
  });
  const { updateIngredient, removeIngredient, selectedPortions } =
    useIngredientMutations(dish, dish.ingredients);
  const ingredients = selectedPortions.map((p) => ({ ...p, selected: false }));

  const handleAdd = () => {
    navigate("add", { state: { backUrl: `/dishes/${dish.id}/ingredients` } });
  };

  const handleUpgradeIngredient = async (ingredient: DishPortion) => {
    updateIngredient.mutate(ingredient);
  };

  const handleDeleteIngredient = async (ingredient: DishPortion) => {
    setConfirm({
      visible: true,
      accept: async () => {
        removeIngredient.mutate(ingredient);
        setConfirm({ visible: false });
      },
    });
  };

  return (
    <Box>
      <PageTitle title={dish.name} className="mb-0 pb-4">
        {!isDishShared && (
          <Button onClick={handleAdd}>
            <FaPlus /> Add
          </Button>
        )}
      </PageTitle>

      {dish.ingredients.length > 0 && !showDetails && (
        <div className="mt-4 mb-2 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails((s) => !s)}
          >
            <FaChevronDown /> Cooking
          </Button>
        </div>
      )}

      <DishIngredientsDetails
        disabled={isDishShared}
        visible={showDetails}
        setVisible={setShowDetails}
        dish={dish}
      />

      <EditDishPortionsForm
        disabled={isDishShared}
        dishPortions={ingredients}
        onSave={handleUpgradeIngredient}
        onDelete={handleDeleteIngredient}
      />

      <Confirm
        message="Are you sure you want to delete this ingredient?"
        open={confirm.visible}
        onConfirm={confirm.accept}
        onClose={() => setConfirm({ visible: false })}
      />
    </Box>
  );
}
