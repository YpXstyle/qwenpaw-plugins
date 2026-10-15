import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" })],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.tsx"],
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
  },
});
