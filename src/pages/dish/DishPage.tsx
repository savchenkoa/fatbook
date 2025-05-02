import NavLinkTab from "@/components/ui/NavLinkTab";
import { FaChevronLeft, FaCopy, FaTrash } from "react-icons/fa";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dishesService } from "@/services/dishes-service";
import { isNil } from "@/utils/is-nil";
import { AppLayout } from "@/components/AppLayout";
import { SHARED_COLLECTION_ID } from "@/constants";
import { useCopyDish } from "@/hooks/use-copy-dish";
import Button from "@/components/ui/Button";

function DishPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { data: dish, isLoading } = useQuery({
    queryKey: ["dish", +params.id!],
    queryFn: () => dishesService.fetchDish(+params.id!),
  });
  const { copyDish } = useCopyDish({ shouldNavigate: true });
  const deleteMutation = useMutation({ mutationFn: dishesService.deleteDish });
  const isCreate = isNil(params.id);
  const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;
  const canDelete = !isCreate && !isDishShared;

  if (!isLoading && !dish) {
    navigate("/not-found");
  }

  const handleBackClick = () => {
    if (location.state?.backUrl) {
      navigate(location.state.backUrl);
    } else {
      navigate("/dishes");
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Please confirm you want to delete this record.")) {
      return;
    }
    deleteMutation.mutate(dish!.id, {
      onSuccess: () => {
        navigate("/dishes");
      },
    });
  };

  const handleCopy = () => {
    if (dish) {
      copyDish.mutate(dish);
    }
  };

  return (
    <AppLayout>
      <div className="tabs is-boxed is-centered mb-0">
        <Button
          icon={<FaChevronLeft />}
          variant="text"
          className="px-4 py-2"
          onClick={handleBackClick}
        />
        <ul>
          <NavLinkTab to="edit">Dish</NavLinkTab>
          <NavLinkTab to="ingredients">
            Ingredients ({dish?.ingredients.length ?? 0})
          </NavLinkTab>
        </ul>

        <Button
          type="submit"
          iconRight={<FaCopy />}
          variant="text"
          className="px-4 py-2"
          onClick={handleCopy}
        />

        {canDelete && (
          <Button
            type="submit"
            icon={<FaTrash />}
            variant="text"
            className="px-4 py-2"
            onClick={handleDelete}
          />
        )}
      </div>
      <Outlet context={{ dish, isDishShared, isLoading }} />
    </AppLayout>
  );
}

export default DishPage;
