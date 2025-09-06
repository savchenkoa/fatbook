import { TutorialStep } from "@/components/ui/tutorial";

export function getTutorialSteps(): TutorialStep[] {
    return [
        {
            title: "Welcome to Fatbook!",
            content:
                "Fatbook is your personal nutrition tracker for monitoring calories and nutrients. Let's show you the main features of the app!",
        },
        {
            title: "Create Your Dishes",
            content:
                "Create your own dishes with detailed information about calories, proteins, fats, and carbohydrates. You can add ingredients, set portion sizes, and even scan nutrition labels!",
            action: {
                text: "Go to Dishes",
                href: "/dishes",
                icon: "utensils",
            },
        },
        {
            title: "Track Your Meals",
            content:
                "Keep a food diary — log all your meals: breakfast, lunch, dinner, and snacks. Monitor your progress day by day.",
            action: {
                text: "Open Food Diary",
                href: "/",
                icon: "calendar",
            },
        },
        {
            title: "Monitor Your Goals",
            content:
                "Set goals for calories and nutrients, track your progress, and adjust your nutrition. In the analytics section, you'll see detailed statistics by days and weeks.",
            action: {
                text: "View Analytics",
                href: "/insights",
                icon: "trending-up",
            },
        },
    ];
}
