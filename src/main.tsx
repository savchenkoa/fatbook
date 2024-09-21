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
import ErrorPage from "@/pages/ErrorPage";
import "./index.css";
import DishPage from "@/pages/dish/DishPage";
import EditDishPage from "@/pages/dish/EditDishPage";
import DishesPage from "@/pages/dishes/DishesPage";
import AddEatingsPage from "@/pages/eatings/AddEatingsPage";
import EatingsPage from "@/pages/eatings/EatingsPage";
import EatingsSummaryPage from "@/pages/eatings/EatingsSummaryPage";
import LoginPage from "@/pages/LoginPage";
import Root from "@/pages/Root";
import SettingsPage from "@/pages/SettingsPage";
import RequireAuth from "@/components/auth/RequireAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/Auth";
import { formatDate, now } from "@/utils/date-utils";
import DishIngredientsLoader from "@/pages/dish/DishIngredientsLoader";
import DishIngredientAddLoader from "@/pages/dish/DishIngredientAddLoader";
import NotFoundPage from "@/pages/NotFoundPage";
import { ThemeProvider } from "@/context/Theme";

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
        children: [
          {
            path: "",
            element: <EatingsSummaryPage />,
          },
          {
            path: ":meal/add",
            element: <AddEatingsPage />,
          },
        ],
      },
      {
        path: "dishes",
        element: <DishesPage />,
      },
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
            element: <DishIngredientsLoader />,
          },
          {
            path: "ingredients/add",
            element: <DishIngredientAddLoader />,
          },
        ],
      },
      {
        path: "trends",
        lazy: () => import("@/pages/TrendsPage"),
      },
      {
        path: "settings",
        element: <SettingsPage />,
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
