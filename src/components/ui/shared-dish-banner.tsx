import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { LucideUsers, LucideCopy, LucidePlus, LucideX, LucideCalendar } from "lucide-react";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { useNavigate } from "react-router-dom";
import { Dish } from "@/types/dish";
import { useState } from "react";
import { formatDate, now } from "@/utils/date-utils";

interface SharedDishBannerProps {
    dish: Dish;
}

export function SharedDishBanner({ dish }: SharedDishBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const { copyDish } = useCopyDish({ shouldNavigate: true });
    const navigate = useNavigate();

    if (isDismissed) return null;

    const handleCopy = () => {
        copyDish.mutate(dish);
    };

    const handleCreateNew = () => {
        navigate("/dishes/new");
    };

    const handleLogMeal = () => {
        const today = formatDate(now());
        // Navigate to add eating page for breakfast meal
        navigate(`/eatings/${today}/breakfast/add`, { 
            state: { selectedDish: dish }
        });
    };

    return (
        <Box className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0">
                    <LucideUsers className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            Community Dish
                        </h3>
                    </div>
                    
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                        This is a shared recipe from our community. You can view the nutrition info and use it to log your meals, but you can't edit it. 
                        Want to customize it? Make your own copy!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            size="sm" 
                            onClick={handleLogMeal}
                            className="flex-1 sm:flex-none"
                        >
                            <LucideCalendar className="mr-2 size-4" />
                            Log as Meal
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopy}
                            disabled={copyDish.isPending}
                            className="flex-1 sm:flex-none"
                        >
                            <LucideCopy className="mr-2 size-4" />
                            {copyDish.isPending ? "Copying..." : "Clone Dish"}
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCreateNew}
                            className="flex-1 sm:flex-none"
                        >
                            <LucidePlus className="mr-2 size-4" />
                            Create New
                        </Button>
                    </div>
                </div>
                
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDismissed(true)}
                    className="flex-shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                    <LucideX className="size-4" />
                </Button>
            </div>
        </Box>
    );
}