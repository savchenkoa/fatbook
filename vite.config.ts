import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  build: {
    outDir: "build",
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    exclude: [...configDefaults.exclude, "tests/**"],
  },
}));
