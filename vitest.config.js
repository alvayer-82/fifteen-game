import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/e2e/**"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    fileParallelism: false,
    isolate: false
  }
});
