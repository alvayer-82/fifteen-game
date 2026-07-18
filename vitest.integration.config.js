import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.js"],
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
