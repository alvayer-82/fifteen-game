import { expect, test } from "@playwright/test";

const leaderboardRecords = [
  { player: "Nina", moves: 70, time: 54, createdAtMs: 1 },
  { player: "Alex", moves: 66, time: 26, createdAtMs: 2 },
  { player: "Maksim", moves: 92, time: 45, createdAtMs: 3 },
  { player: "Olga", moves: 74, time: 47, createdAtMs: 4 },
  { player: "Pavel", moves: 84, time: 38, createdAtMs: 5 },
  { player: "Ira", moves: 85, time: 54, createdAtMs: 6 },
  { player: "Roma", moves: 91, time: 51, createdAtMs: 7 },
  { player: "Den", moves: 93, time: 45, createdAtMs: 8 },
  { player: "Zoya", moves: 94, time: 45, createdAtMs: 9 },
  { player: "Lena", moves: 98, time: 48, createdAtMs: 10 },
  { player: "Boris", moves: 99, time: 49, createdAtMs: 11 },
  { player: "Yana", moves: 100, time: 50, createdAtMs: 12 },
  { player: "Kirill", moves: 101, time: 51, createdAtMs: 13 },
  { player: "Sveta", moves: 102, time: 52, createdAtMs: 14 },
  { player: "Anton", moves: 103, time: 53, createdAtMs: 15 },
  { player: "Mira", moves: 104, time: 54, createdAtMs: 16 },
  { player: "Fedor", moves: 105, time: 55, createdAtMs: 17 },
  { player: "Vera", moves: 106, time: 56, createdAtMs: 18 },
  { player: "Tim", moves: 107, time: 57, createdAtMs: 19 },
  { player: "Oksana", moves: 108, time: 58, createdAtMs: 20 },
  { player: "Rita", moves: 109, time: 59, createdAtMs: 21 },
  { player: "Gleb", moves: 110, time: 60, createdAtMs: 22 },
  { player: "Inga", moves: 111, time: 61, createdAtMs: 23 },
  { player: "Stepan", moves: 112, time: 62, createdAtMs: 24 },
  { player: "Timur", moves: 113, time: 63, createdAtMs: 25 }
];

async function openGame(page, overrides = {}) {
  await page.addInitScript((config) => {
    window.__FIFTEEN_GAME_TEST_CONFIG__ = config;
  }, {
    leaderboardRecords,
    fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 14, 15],
    saveResult: false,
    ...overrides
  });

  await page.goto("/");
}

test.describe("functional e2e", () => {
  test("completes player start and multi-move gameplay flow with visible UI updates", async ({ page }) => {
    await openGame(page, {
      fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 13, 14, 15]
    });

    await page.fill("#playerName", "FlowPlayer");
    await page.click("#playerForm button[type='submit']");

    await expect(page.locator("#message")).toContainText("FlowPlayer");
    await expect(page.locator("#moves")).toHaveText("0");

    await page.click("#board > :nth-child(14)");
    await expect(page.locator("#moves")).toHaveText("1");
    await expect(page.locator("#message")).toContainText("Отлично");
    await expect(page.locator("#board > :nth-child(14)")).toHaveClass(/empty/);

    await page.waitForTimeout(1100);
    await expect(page.locator("#timer")).not.toHaveText("00:00");

    await page.click("#board > :nth-child(15)");
    await expect(page.locator("#moves")).toHaveText("2");
    await expect(page.locator("#board > :nth-child(15)")).toHaveClass(/empty/);
  });

  test("lets the player choose an existing name from suggestions and start a session", async ({ page }) => {
    await openGame(page);

    await expect(page.locator("#playerSuggestions option")).toHaveCount(25);
    await page.fill("#playerName", "Maksim");
    await page.click("#playerForm button[type='submit']");

    await expect(page.locator("#message")).toContainText("Maksim");
    await expect(page.locator("#moves")).toHaveText("0");
    await expect(page.locator("#board > :nth-child(14)")).toHaveClass(/empty/);
  });

  test("supports sorting and pagination together in one session", async ({ page }) => {
    await openGame(page);

    await page.click("[data-sort-key='player']");
    await page.click("[data-sort-key='player']");
    await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Zoya");

    await page.click("#leaderboardPagination [data-page-action='last']");
    await expect(page.locator(".leaderboard-rank").first()).toHaveText("#21");

    await page.click("[data-sort-key='moves']");
    await expect(page.locator(".leaderboard-rank").first()).toHaveText("#1");
    await expect(page.locator(".leaderboard-player").first()).toHaveText("Alex");
  });

  test("shows newly saved result in leaderboard in controlled test mode", async ({ page }) => {
    await openGame(page, {
      fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
      saveResult: true,
      persistSavedRecord: true,
      savedRecordCreatedAtMs: 999999
    });

    await page.fill("#playerName", "Champion");
    await page.click("#playerForm button[type='submit']");
    await page.click("#board .tile:last-of-type");

    await expect(page.locator("#message")).toContainText("Результат добавлен");
    const firstDataRow = page.locator(".leaderboard-row").nth(1);

    await expect(page.locator(".leaderboard-rank").first()).toHaveText("#1");
    await expect(page.locator(".leaderboard-player").first()).toHaveText("Champion");
    await expect(firstDataRow.locator(".leaderboard-metric").first()).toHaveText("1");
    await expect(page.locator("#playerSuggestions option[value='Champion']")).toHaveCount(1);
  });
});
