export const LEADERBOARD_PAGE_SIZE = 10;

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getSortIndicator(sortState, key) {
  if (sortState.key !== key) {
    return "";
  }

  return sortState.direction === "asc" ? "▲" : "▼";
}

export function compareRecords(first, second, sortState) {
  if (sortState.key === "player") {
    const byPlayer = first.player.localeCompare(second.player, "ru", { sensitivity: "base" });
    if (byPlayer !== 0) {
      return sortState.direction === "asc" ? byPlayer : -byPlayer;
    }
  }

  if (sortState.key === "moves") {
    const byMoves = first.moves - second.moves;
    if (byMoves !== 0) {
      return sortState.direction === "asc" ? byMoves : -byMoves;
    }
  }

  if (sortState.key === "time") {
    const byTime = first.time - second.time;
    if (byTime !== 0) {
      return sortState.direction === "asc" ? byTime : -byTime;
    }
  }

  if (first.moves !== second.moves) {
    return first.moves - second.moves;
  }

  if (first.time !== second.time) {
    return first.time - second.time;
  }

  return first.player.localeCompare(second.player, "ru", { sensitivity: "base" });
}

export function getSortedLeaderboardRecords(records, sortState) {
  return records.slice().sort((first, second) => compareRecords(first, second, sortState));
}

export function getLeaderboardPageCount(records, pageSize = LEADERBOARD_PAGE_SIZE) {
  return Math.max(1, Math.ceil(records.length / pageSize));
}

export function getPagedLeaderboardRecords(records, page, pageSize = LEADERBOARD_PAGE_SIZE) {
  const totalPages = getLeaderboardPageCount(records, pageSize);
  const normalizedPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (normalizedPage - 1) * pageSize;

  return {
    page: normalizedPage,
    totalPages,
    startIndex,
    records: records.slice(startIndex, startIndex + pageSize)
  };
}

export function getUniquePlayers(records) {
  return [...new Set(records.map((record) => record.player).filter(Boolean))];
}

export function getFilteredLeaderboardRecords(records, searchQuery) {
  const normalizedQuery = String(searchQuery ?? "").trim().toLocaleLowerCase("ru");

  if (!normalizedQuery) {
    return records.slice();
  }

  return records.filter((record) => record.player.toLocaleLowerCase("ru").includes(normalizedQuery));
}
