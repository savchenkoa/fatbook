import "bulma/css/bulma.min.css";
import React from "react";
import { setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ErrorPage } from "@/pages/error-page.tsx";
import "./index.css";
import { DishPage } from "@/pages/dish/dish-page.tsx";
import { EditDishPage } from "@/pages/dish/edit-dish-page.tsx";
import { DishesPage } from "@/pages/dishes/dishes-page.tsx";
import { AddEatingsPage } from "@/pages/eatings/add-eatings-page.tsx";
import { LoginPage } from "@/pages/login-page.tsx";
import { Root } from "@/pages/root.tsx";
import RequireAuth from "@/components/auth/RequireAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth.tsx";
import { formatDate, now } from "@/utils/date-utils";
import { IngredientsLoader } from "@/pages/dish/ingredients-loader.tsx";
import AddIngredientLoader from "@/pages/dish/add-ingredient-loader.tsx";
import { NotFoundPage } from "@/pages/not-found-page.tsx";
import { ThemeProvider } from "@/context/theme.tsx";
import { AccountPage } from "@/pages/account/account-page.tsx";
import { AboutPage } from "@/pages/account/about-page.tsx";
import { GoalsPage } from "@/pages/account/goals-page.tsx";
import { EatingsPage } from "@/pages/eatings/eatings-page.tsx"; // registerLocale("en-GB", enGB);

// registerLocale("en-GB", enGB);
setDefaultLocale("en-GB");

const today = formatDate(now());

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <Root />
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
      // TODO: simplify routing
      {
        path: "dishes/:id",
        element: <DishPage />,
        children: [
          { path: "", element: <Navigate to={`edit`} replace /> },
          {
            path: "edit", // edit/delete
            element: <EditDishPage />,
          },
          {
            path: "ingredients",
            element: <IngredientsLoader />,
          },
          {
            path: "ingredients/add",
            element: <AddIngredientLoader />,
          },
        ],
      },
      {
        path: "insights",
        lazy: () => import("@/pages/insights-page.tsx"),
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
    <ToastContainer position="top-center" />
  </React.StrictMode>,
);
