import { expect, test } from "@playwright/test";

async function openProductionApp(page) {
  await page.goto("./");
}

test.describe("production smoke", () => {
  test("loads the published application shell", async ({ page }) => {
    await openProductionApp(page);

    await expect(page.locator("#playerForm")).toBeVisible();
    await expect(page.locator("#board .tile, #board .empty")).toHaveCount(16);
    await expect(page.locator("#leaderboard")).toBeVisible();
    await expect(page.locator("#shuffleButton")).toBeVisible();
    await expect(page.locator("#hintButton")).toBeVisible();
  });

  test("loads leaderboard data from production backend", async ({ page }) => {
    await openProductionApp(page);

    await expect(page.locator(".leaderboard-empty")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator(".leaderboard-row")).toHaveCount(11, { timeout: 15_000 });
    await expect(page.locator(".leaderboard-rank").first()).toContainText("#1");
  });

  test("supports production leaderboard sorting", async ({ page }) => {
    await openProductionApp(page);

    const firstPlayerCell = page.locator(".leaderboard-row").nth(1).locator(".leaderboard-player");
    await expect(firstPlayerCell).toBeVisible({ timeout: 15_000 });
    const initialPlayer = await firstPlayerCell.textContent();

    await page.click("[data-sort-key='player']");
    await expect(page.locator("[data-sort-key='player'] .leaderboard-sort-indicator")).not.toHaveText("");
    const afterFirstSort = await firstPlayerCell.textContent();

    await page.click("[data-sort-key='player']");
    const afterSecondSort = await firstPlayerCell.textContent();

    expect(initialPlayer).not.toBeNull();
    expect(afterFirstSort).not.toBeNull();
    expect(afterSecondSort).not.toBeNull();
    expect(new Set([initialPlayer, afterFirstSort, afterSecondSort]).size).toBeGreaterThan(1);
  });

  test("supports production leaderboard pagination when more than one page exists", async ({ page }) => {
    await openProductionApp(page);

    const nextButton = page.locator("#leaderboardPagination [data-page-action='next']");
    await expect(nextButton).toBeVisible({ timeout: 15_000 });

    if (await nextButton.isDisabled()) {
      test.skip(true, "Production leaderboard currently has only one page of records.");
    }

    const firstRankBefore = await page.locator(".leaderboard-rank").first().textContent();
    await nextButton.click();
    await expect(page.locator(".leaderboard-rank").first()).not.toHaveText(firstRankBefore ?? "");

    const prevButton = page.locator("#leaderboardPagination [data-page-action='prev']");
    await prevButton.click();
    await expect(page.locator(".leaderboard-rank").first()).toHaveText(firstRankBefore ?? "#1");
  });

  test("starts a production game and allows a real move without saving a score", async ({ page }) => {
    await openProductionApp(page);

    await page.fill("#playerName", "ProductionSmoke");
    await page.click("#playerForm button[type='submit']");

    const movesBefore = await page.locator("#moves").textContent();
    await page.keyboard.press("ArrowRight");
    const movesAfter = await page.locator("#moves").textContent();

    expect(movesBefore).toBe("0");
    expect(movesAfter).toBe("1");
    await expect(page.locator("#timer")).not.toHaveText("00:00");
  });
});
