import { defineConfig } from "@playwright/test";

const productionBaseUrl = process.env.PLAYWRIGHT_BASE_URL || "https://alvayer-82.github.io/fifteen-game/";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /production-smoke\.spec\.js/,
  timeout: 30_000,
  use: {
    baseURL: productionBaseUrl,
    headless: true,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium"
      }
    }
  ]
});
