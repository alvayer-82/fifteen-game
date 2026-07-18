export const LEADERBOARD_COLLECTION_NAME = "leaderboard_v2";
export const LEADERBOARD_FETCH_LIMIT = 100;

export function mapStoredLeaderboardRecord(data) {
  return {
    player: String(data?.player ?? ""),
    moves: Number(data?.moves ?? 0),
    time: Number(data?.timeSeconds ?? 0),
    createdAtMs: Number(data?.createdAtMs ?? 0)
  };
}

export function createLeaderboardRecordPayload({ player, moves, timeSeconds }, createdAtMs = Date.now()) {
  return {
    player,
    moves,
    timeSeconds,
    createdAtMs
  };
}
