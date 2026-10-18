import { createContext } from "react";
import type { GoApi } from "@fatbook/api-client/go";

export const GoApiContext = createContext<GoApi | null>(null);
