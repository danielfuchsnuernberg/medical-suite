import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the built screens load from the program's own folder (file://), with no server.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
});
