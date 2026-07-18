import {
  createLeaderboardRecordPayload,
  LEADERBOARD_COLLECTION_NAME,
  LEADERBOARD_FETCH_LIMIT,
  mapStoredLeaderboardRecord
} from "./leaderboard-storage-core.js";

export async function fetchLeaderboardRecords({ firestore, firebaseApi }) {
  if (!firestore) {
    return {
      success: false,
      code: "unavailable",
      records: []
    };
  }

  try {
    const leaderboardQuery = firebaseApi.query(
      firebaseApi.collection(firestore, LEADERBOARD_COLLECTION_NAME),
      firebaseApi.orderBy("createdAtMs", "desc"),
      firebaseApi.limit(LEADERBOARD_FETCH_LIMIT)
    );
    const snapshot = await firebaseApi.getDocs(leaderboardQuery);

    return {
      success: true,
      records: snapshot.docs.map((documentSnapshot) => mapStoredLeaderboardRecord(documentSnapshot.data()))
    };
  } catch {
    return {
      success: false,
      code: "load-failed",
      records: []
    };
  }
}

export async function saveLeaderboardRecord({
  firestore,
  player,
  moves,
  timeSeconds,
  firebaseApi,
  now = () => Date.now()
}) {
  if (!firestore) {
    return {
      success: false,
      code: "unavailable"
    };
  }

  try {
    await firebaseApi.addDoc(
      firebaseApi.collection(firestore, LEADERBOARD_COLLECTION_NAME),
      {
        ...createLeaderboardRecordPayload(
          {
            player,
            moves,
            timeSeconds
          },
          now()
        ),
        createdAt: firebaseApi.serverTimestamp()
      }
    );

    return {
      success: true
    };
  } catch {
    return {
      success: false,
      code: "save-failed"
    };
  }
}
