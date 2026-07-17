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
  { player: "Yana", moves: 100, time: 50, createdAtMs: 12 }
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((records) => {
    window.__FIFTEEN_GAME_TEST_CONFIG__ = {
      leaderboardRecords: records,
      fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 14, 15],
      saveResult: false
    };
  }, leaderboardRecords);
});

test("renders the page and loads the first leaderboard page", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#board .tile")).toHaveCount(15);
  await expect(page.locator(".leaderboard-rank")).toHaveCount(10);
  await expect(page.locator(".leaderboard-rank").first()).toHaveText("#1");
  await expect(page.locator(".leaderboard-rank").last()).toHaveText("#10");
  await expect(page.locator("#leaderboardPagination [data-page-action='next']")).toBeVisible();
});

test("starts a new game from player form", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#board > :nth-child(16)")).toHaveClass(/empty/);

  await page.fill("#playerName", "SmokePlayer");
  await page.click("#playerForm button[type='submit']");

  await expect(page.locator("#board > :nth-child(14)")).toHaveClass(/empty/);
  await expect(page.locator("#moves")).toHaveText("0");
  await expect(page.locator("#timer")).toHaveText("00:00");
});

test("sorts leaderboard by time when clicking the column", async ({ page }) => {
  await page.goto("/");

  await page.click("[data-sort-key='time']");

  const firstRow = page.locator(".leaderboard-row").nth(1);
  await expect(firstRow.locator(".leaderboard-player")).toHaveText("Alex");
  await expect(firstRow.locator(".leaderboard-metric").nth(1)).toHaveText("00:26");
});

test("moves between leaderboard pages", async ({ page }) => {
  await page.goto("/");

  await page.click("#leaderboardPagination [data-page-action='next']");

  await expect(page.locator(".leaderboard-rank").first()).toHaveText("#11");
  await expect(page.locator(".leaderboard-player").first()).toHaveText("Boris");
});
