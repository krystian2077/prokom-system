import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["tests/tech/**/*.test.ts", "lib/tech/**/*.test.ts"],
    environment: "node",
  },
});
