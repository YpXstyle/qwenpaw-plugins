import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "index.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom"],
      output: { inlineDynamicImports: true },
    },
  },
});
