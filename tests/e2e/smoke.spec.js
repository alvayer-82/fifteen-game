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

test("renders the page and loads the first leaderboard page", async ({ page }) => {
  await openGame(page);

  await expect(page.locator("#board .tile")).toHaveCount(15);
  await expect(page.locator(".leaderboard-rank")).toHaveCount(10);
  await expect(page.locator(".leaderboard-rank").first()).toHaveText("#1");
  await expect(page.locator(".leaderboard-rank").last()).toHaveText("#10");
  await expect(page.locator("#leaderboardPagination [data-page-action='next']")).toBeVisible();
});

test("requires a player name before starting", async ({ page }) => {
  await openGame(page);

  await page.click("#playerForm button[type='submit']");

  await expect(page.locator("#playerName")).toBeFocused();
  await expect(page.locator("#message")).toContainText("Введите имя игрока");
  await expect(page.locator("#moves")).toHaveText("0");
});

test("starts a new game from player form", async ({ page }) => {
  await openGame(page);

  await expect(page.locator("#board > :nth-child(16)")).toHaveClass(/empty/);

  await page.fill("#playerName", "SmokePlayer");
  await page.click("#playerForm button[type='submit']");

  await expect(page.locator("#board > :nth-child(14)")).toHaveClass(/empty/);
  await expect(page.locator("#moves")).toHaveText("0");
  await expect(page.locator("#timer")).toHaveText("00:00");
  await expect(page.locator("#message")).toContainText("SmokePlayer");
  await expect(page.locator("#message")).toContainText("Соберите числа");
});

test("shows a hint after the game starts", async ({ page }) => {
  await openGame(page);

  await page.fill("#playerName", "HintPlayer");
  await page.click("#playerForm button[type='submit']");
  await page.click("#hintButton");

  await expect(page.locator(".tile-highlight")).toHaveCount(1);
  await expect(page.locator("#message")).toContainText("Подсветил");
});

test("supports keyboard movement after the game starts", async ({ page }) => {
  await openGame(page);

  await page.fill("#playerName", "KeyboardPlayer");
  await page.click("#playerForm button[type='submit']");
  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#moves")).toHaveText("1");
  await expect(page.locator("#board > :nth-child(13)")).toHaveClass(/empty/);
});

test("sorts leaderboard by player, moves and time", async ({ page }) => {
  await openGame(page);

  await page.click("[data-sort-key='player']");
  await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Alex");

  await page.click("[data-sort-key='player']");
  await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Zoya");

  await page.click("[data-sort-key='moves']");
  await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Alex");

  await page.click("[data-sort-key='moves']");
  await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Yana");

  await page.click("[data-sort-key='time']");
  await expect(page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player")).toHaveText("Alex");
});

test("moves between leaderboard pages in both directions", async ({ page }) => {
  await openGame(page);

  await page.click("#leaderboardPagination [data-page-action='next']");
  await expect(page.locator(".leaderboard-rank").first()).toHaveText("#11");
  await expect(page.locator(".leaderboard-player").first()).toHaveText("Boris");

  await page.click("#leaderboardPagination [data-page-action='prev']");
  await expect(page.locator(".leaderboard-rank").first()).toHaveText("#1");
  await expect(page.locator(".leaderboard-player").first()).toHaveText("Alex");
});

test("allows choosing a player from existing suggestions", async ({ page }) => {
  await openGame(page);

  await expect(page.locator("#playerSuggestions option")).toHaveCount(12);
  await page.fill("#playerName", "Alex");
  await page.click("#playerForm button[type='submit']");

  await expect(page.locator("#message")).toContainText("Alex");
});

test("renders an empty leaderboard state", async ({ page }) => {
  await openGame(page, {
    leaderboardRecords: []
  });

  await expect(page.locator(".leaderboard-empty")).toContainText("Пока нет рекордов");
  await expect(page.locator("#leaderboardPagination")).toBeEmpty();
});

test("shows a backend error state when leaderboard loading fails", async ({ page }) => {
  await openGame(page, {
    loadError: true
  });

  await expect(page.locator(".leaderboard-empty")).toContainText("Не удалось загрузить рекорды");
  await expect(page.locator("#playerSuggestions option")).toHaveCount(0);
});

test("handles a winning move in test mode", async ({ page }) => {
  await openGame(page, {
    fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
    saveResult: true
  });

  await page.fill("#playerName", "Winner");
  await page.click("#playerForm button[type='submit']");
  await page.click("#board .tile:last-of-type");

  await expect(page.locator("#moves")).toHaveText("1");
  await expect(page.locator("#board > :nth-child(16)")).toHaveClass(/empty/);
  await expect(page.locator("#message")).toContainText("Победа");
  await expect(page.locator("#message")).toContainText("Результат добавлен");
});

test("shows an unavailable leaderboard message when save fails", async ({ page }) => {
  await openGame(page, {
    fixedTiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
    saveResult: false
  });

  await page.fill("#playerName", "Winner");
  await page.click("#playerForm button[type='submit']");
  await page.click("#board .tile:last-of-type");

  await expect(page.locator("#message")).toContainText("Победа");
  await expect(page.locator("#message")).toContainText("онлайн-рейтинг");
  await expect(page.locator("#message")).toContainText("недоступен");
});
