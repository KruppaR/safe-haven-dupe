import { defineConfig } from "@tanstack/react-start/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), tsConfigPaths()],
  },
  server: {
    preset: "vercel",
    entry: "server",
  },
});
