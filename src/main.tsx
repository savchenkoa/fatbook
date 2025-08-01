import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ErrorPage } from "@/features/core/error-page.tsx";
import "./index.css";
import { DishesPage } from "@/features/dishes/dishes-page.tsx";
import { AddEatingsPage } from "@/features/eatings/add-eatings-page.tsx";
import { LoginPage } from "@/features/auth/login-page.tsx";
import { RootLayout } from "@/components/layout/root-layout.tsx";
import { RequireAuth } from "@/features/auth/require-auth.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth.tsx";
import { formatDate, now } from "@/utils/date-utils";
import { NotFoundPage } from "@/features/core/not-found-page.tsx";
import { ThemeProvider } from "@/context/theme.tsx";
import { AccountPage } from "@/features/account/account-page.tsx";
import { AboutPage } from "@/features/account/about-page.tsx";
import { GoalsPage } from "@/features/account/goals-page.tsx";
import { EatingsPage } from "@/features/eatings/eatings-page.tsx";
import { AddIngredientsPage } from "@/features/dish/add-ingredients-page.tsx";
import { CreateDishPage } from "@/features/dish/create-dish-page.tsx";
import { EditDishPage } from "@/features/dish/edit-dish-page.tsx";

const today = formatDate(now());

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <RootLayout />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to={`eatings/${today}`} replace /> },
      {
        path: "eatings",
        element: <Navigate to={`/eatings/${today}`} replace />,
      },
      {
        path: "eatings/:day",
        element: <EatingsPage />,
      },
      {
        path: "eatings/:day/:meal/add",
        element: <AddEatingsPage />,
      },
      {
        path: "dishes",
        element: <DishesPage />,
      },
      {
        path: "dishes/new",
        element: <CreateDishPage />,
      },
      {
        path: "dishes/:id",
        element: <EditDishPage />,
      },
      {
        path: "dishes/:id/add-ingredients",
        element: <AddIngredientsPage />,
      },
      {
        path: "insights",
        lazy: () => import("@/features/insights/insights-page.tsx"),
      },
      {
        path: "account",
        element: <AccountPage />,
      },
      {
        path: "account/about",
        element: <AboutPage />,
      },
      {
        path: "account/goals",
        element: <GoalsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/not-found",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
