import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import {
  areAdjacent,
  BOARD_SIZE,
  createSolvedTiles,
  formatTime,
  getColumn,
  getRow,
  isSolvable,
  isSolved,
  swapTiles
} from "./src/game-core.js";
import {
  escapeHtml,
  getLeaderboardPageCount,
  getPagedLeaderboardRecords,
  getSortedLeaderboardRecords,
  getSortIndicator,
  getUniquePlayers,
  LEADERBOARD_PAGE_SIZE
} from "./src/leaderboard-core.js";
import {
  fetchLeaderboardRecords,
  saveLeaderboardRecord
} from "./src/leaderboard-service.js";

const boardElement = document.getElementById("board");
const movesElement = document.getElementById("moves");
const timerElement = document.getElementById("timer");
const messageElement = document.getElementById("message");
const shuffleButton = document.getElementById("shuffleButton");
const hintButton = document.getElementById("hintButton");
const playerForm = document.getElementById("playerForm");
const playerNameInput = document.getElementById("playerName");
const playerSuggestionsElement = document.getElementById("playerSuggestions");
const leaderboardElement = document.getElementById("leaderboard");
const leaderboardPaginationElement = document.getElementById("leaderboardPagination");
const testConfig = window.__FIFTEEN_GAME_TEST_CONFIG__ ?? null;
const isTestMode = Boolean(testConfig);
const testLeaderboardRecords = Array.isArray(testConfig?.leaderboardRecords)
  ? testConfig.leaderboardRecords
  : [];

const size = BOARD_SIZE;
const leaderboardPageSize = LEADERBOARD_PAGE_SIZE;
const hasFirebaseConfig = !isTestMode && Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0 && !value.includes("PASTE_YOUR_FIREBASE_")
);
const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

let tiles = [];
let moveCount = 0;
let secondsElapsed = 0;
let timerId = null;
let gameStarted = false;
let currentPlayer = "";
let leaderboardRecords = [];
let leaderboardSort = {
  key: "moves",
  direction: "asc"
};
let leaderboardPage = 1;

function renderBoard() {
  boardElement.innerHTML = "";

  tiles.forEach((value, index) => {
    if (value === 0) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "empty";
      emptyCell.setAttribute("aria-hidden", "true");
      boardElement.appendChild(emptyCell);
      return;
    }

    const tileButton = document.createElement("button");
    tileButton.className = "tile";
    tileButton.type = "button";
    tileButton.textContent = value;
    tileButton.setAttribute("aria-label", `Плитка ${value}`);
    tileButton.addEventListener("click", () => handleTileClick(index));
    boardElement.appendChild(tileButton);
  });
}

function updateStats() {
  movesElement.textContent = String(moveCount);
  timerElement.textContent = formatTime(secondsElapsed);
}

function setMessage(text) {
  messageElement.textContent = text;
}

function renderLeaderboardPagination(totalRecords, currentPage, totalPages) {
  if (totalRecords === 0) {
    leaderboardPaginationElement.innerHTML = "";
    return;
  }

  const startRecord = (currentPage - 1) * leaderboardPageSize + 1;
  const endRecord = Math.min(totalRecords, currentPage * leaderboardPageSize);

  leaderboardPaginationElement.innerHTML = `
    <span class="leaderboard-page-info">
      Показаны ${startRecord}-${endRecord} из ${totalRecords}
    </span>
    <div class="leaderboard-page-actions">
      <button class="leaderboard-page-button" type="button" data-page-action="prev" ${currentPage === 1 ? "disabled" : ""}>
        Назад
      </button>
      <button class="leaderboard-page-button" type="button" data-page-action="next" ${currentPage === totalPages ? "disabled" : ""}>
        Вперёд
      </button>
    </div>
  `;
}

function renderLeaderboard(records, note) {
  if (note) {
    leaderboardElement.innerHTML = `<div class="leaderboard-empty">${escapeHtml(note)}</div>`;
    leaderboardPaginationElement.innerHTML = "";
    return;
  }

  if (records.length === 0) {
    leaderboardElement.innerHTML = '<div class="leaderboard-empty">Пока нет рекордов. Сыграйте первую партию.</div>';
    leaderboardPaginationElement.innerHTML = "";
    return;
  }

  const sortedRecords = getSortedLeaderboardRecords(records, leaderboardSort);
  const pagedLeaderboard = getPagedLeaderboardRecords(sortedRecords, leaderboardPage, leaderboardPageSize);
  leaderboardPage = pagedLeaderboard.page;

  const rows = pagedLeaderboard.records
    .map((record, index) => `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">#${pagedLeaderboard.startIndex + index + 1}</span>
        <span class="leaderboard-player">${escapeHtml(record.player)}</span>
        <span class="leaderboard-metric">${record.moves}</span>
        <span class="leaderboard-metric">${formatTime(record.time)}</span>
      </div>
    `)
    .join("");

  leaderboardElement.innerHTML = `
    <div class="leaderboard-row leaderboard-head">
      <span>Место</span>
      <span>
        <button class="leaderboard-sort" type="button" data-sort-key="player" data-align="left">
          Игрок
          <span class="leaderboard-sort-indicator">${getSortIndicator(leaderboardSort, "player")}</span>
        </button>
      </span>
      <span class="leaderboard-metric">
        <button class="leaderboard-sort" type="button" data-sort-key="moves">
          Ходы
          <span class="leaderboard-sort-indicator">${getSortIndicator(leaderboardSort, "moves")}</span>
        </button>
      </span>
      <span class="leaderboard-metric">
        <button class="leaderboard-sort" type="button" data-sort-key="time">
          Время
          <span class="leaderboard-sort-indicator">${getSortIndicator(leaderboardSort, "time")}</span>
        </button>
      </span>
    </div>
    ${rows}
  `;

  renderLeaderboardPagination(sortedRecords.length, leaderboardPage, pagedLeaderboard.totalPages);
}

function renderPlayerSuggestions(records) {
  const uniquePlayers = getUniquePlayers(records);

  playerSuggestionsElement.innerHTML = uniquePlayers
    .map((player) => `<option value="${escapeHtml(player)}"></option>`)
    .join("");
}

async function loadLeaderboard() {
  if (isTestMode) {
    if (testConfig?.loadError) {
      renderLeaderboard([], "Не удалось загрузить рекорды. Проверьте настройки Firebase и Firestore Rules.");
      renderPlayerSuggestions([]);
      return;
    }

    leaderboardRecords = testLeaderboardRecords.map((record) => ({
      player: String(record.player ?? ""),
      moves: Number(record.moves ?? 0),
      time: Number(record.time ?? 0),
      createdAtMs: Number(record.createdAtMs ?? 0)
    }));
    leaderboardPage = 1;
    renderLeaderboard(leaderboardRecords);
    renderPlayerSuggestions(leaderboardRecords);
    return;
  }

  if (!firestore) {
    renderLeaderboard([], "Онлайн-рейтинг отключен. Подключите Firebase в файле firebase-config.js.");
    renderPlayerSuggestions([]);
    return;
  }

  renderLeaderboard([], "Загружаю общий рейтинг...");

  try {
    const result = await fetchLeaderboardRecords({
      firestore,
      firebaseApi: {
        collection,
        getDocs,
        limit,
        orderBy,
        query
      }
    });

    if (!result.success) {
      throw new Error(result.code);
    }

    leaderboardRecords = result.records;
    leaderboardPage = 1;
    renderLeaderboard(leaderboardRecords);
    renderPlayerSuggestions(result.records);
  } catch {
    renderLeaderboard([], "Не удалось загрузить рекорды. Проверьте настройки Firebase и Firestore Rules.");
    renderPlayerSuggestions([]);
  }
}

async function saveRecord() {
  if (isTestMode) {
    const saved = Boolean(testConfig?.saveResult);

    if (saved && testConfig?.persistSavedRecord) {
      const savedRecord = {
        player: currentPlayer,
        moves: moveCount,
        time: secondsElapsed,
        createdAtMs: Number(testConfig?.savedRecordCreatedAtMs ?? Date.now())
      };

      leaderboardRecords = [savedRecord, ...leaderboardRecords];
      leaderboardPage = 1;
      renderLeaderboard(leaderboardRecords);
      renderPlayerSuggestions(leaderboardRecords);
    }

    return saved;
  }

  if (!firestore) {
    return false;
  }

  const result = await saveLeaderboardRecord({
    firestore,
    player: currentPlayer,
    moves: moveCount,
    timeSeconds: secondsElapsed,
    firebaseApi: {
      addDoc,
      collection,
      serverTimestamp
    }
  });

  if (!result.success) {
    return false;
  }

  await loadLeaderboard();
  return true;
}

function getPlayerName() {
  return playerNameInput.value.trim();
}

function getEmptyIndex() {
  return tiles.indexOf(0);
}

function shuffleTiles() {
  const shuffled = createSolvedTiles(size).slice();

  do {
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
  } while (!isSolvable(shuffled, size) || isSolved(shuffled));

  return shuffled;
}

function startTimer() {
  if (timerId !== null) {
    return;
  }

  timerId = window.setInterval(() => {
    secondsElapsed += 1;
    updateStats();
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startGame() {
  if (!currentPlayer) {
    setMessage("Введите имя игрока и нажмите «Старт».");
    playerNameInput.focus();
    return;
  }

  tiles = Array.isArray(testConfig?.fixedTiles) ? testConfig.fixedTiles.slice() : shuffleTiles();
  moveCount = 0;
  secondsElapsed = 0;
  gameStarted = true;
  stopTimer();
  updateStats();
  renderBoard();
  setMessage(`Игрок ${currentPlayer}, поле перемешано. Соберите числа от 1 до 15.`);
}

function highlightMovableTile() {
  const emptyIndex = getEmptyIndex();
  const movableIndex = tiles.findIndex((value, index) => value !== 0 && areAdjacent(index, emptyIndex, size));

  if (movableIndex === -1) {
    return;
  }

  const tileButton = boardElement.children[movableIndex];
  tileButton.classList.add("tile-highlight");
  window.setTimeout(() => tileButton.classList.remove("tile-highlight"), 650);
}

async function handleTileClick(tileIndex) {
  const emptyIndex = getEmptyIndex();

  if (!areAdjacent(tileIndex, emptyIndex, size)) {
    setMessage("Можно перемещать только соседнюю с пустой ячейкой плитку.");
    return;
  }

  if (gameStarted && moveCount === 0 && secondsElapsed === 0) {
    startTimer();
  }

  tiles = swapTiles(tiles, tileIndex, emptyIndex);
  moveCount += 1;
  renderBoard();
  updateStats();

  if (isSolved(tiles)) {
    stopTimer();
    const saved = await saveRecord();
    if (saved) {
      setMessage(`Победа! Вы решили головоломку за ${moveCount} ходов и ${formatTime(secondsElapsed)}. Результат добавлен в общий рейтинг.`);
      return;
    }

    setMessage(`Победа! Вы решили головоломку за ${moveCount} ходов и ${formatTime(secondsElapsed)}. Но онлайн-рейтинг сейчас недоступен.`);
    return;
  }

  setMessage("Отлично, продолжайте.");
}

document.addEventListener("keydown", (event) => {
  const emptyIndex = getEmptyIndex();
  const row = getRow(emptyIndex, size);
  const column = getColumn(emptyIndex, size);

  const moves = {
    ArrowUp: row < size - 1 ? emptyIndex + size : null,
    ArrowDown: row > 0 ? emptyIndex - size : null,
    ArrowLeft: column < size - 1 ? emptyIndex + 1 : null,
    ArrowRight: column > 0 ? emptyIndex - 1 : null
  };

  const nextIndex = moves[event.key];

  if (nextIndex === undefined || nextIndex === null) {
    return;
  }

  event.preventDefault();
  handleTileClick(nextIndex);
});

shuffleButton.addEventListener("click", startGame);
hintButton.addEventListener("click", () => {
  if (!gameStarted) {
    setMessage("Сначала начните новую игру.");
    return;
  }

  highlightMovableTile();
  setMessage("Подсветил одну из доступных плиток.");
});

leaderboardElement.addEventListener("click", (event) => {
  const sortButton = event.target.closest("[data-sort-key]");
  if (!sortButton) {
    return;
  }

  const nextSortKey = sortButton.dataset.sortKey;
  if (!nextSortKey) {
    return;
  }

  if (leaderboardSort.key === nextSortKey) {
    leaderboardSort.direction = leaderboardSort.direction === "asc" ? "desc" : "asc";
  } else {
    leaderboardSort = {
      key: nextSortKey,
      direction: "asc"
    };
  }

  leaderboardPage = 1;
  renderLeaderboard(leaderboardRecords);
});

leaderboardPaginationElement.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page-action]");
  if (!pageButton) {
    return;
  }

  const action = pageButton.dataset.pageAction;
  const totalPages = getLeaderboardPageCount(leaderboardRecords, leaderboardPageSize);

  if (action === "prev" && leaderboardPage > 1) {
    leaderboardPage -= 1;
  }

  if (action === "next" && leaderboardPage < totalPages) {
    leaderboardPage += 1;
  }

  renderLeaderboard(leaderboardRecords);
});

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nextPlayer = getPlayerName();
  if (!nextPlayer) {
    setMessage("Введите имя игрока, чтобы начать.");
    playerNameInput.focus();
    return;
  }

  currentPlayer = nextPlayer;
  startGame();
});

tiles = createSolvedTiles(size);
renderBoard();
updateStats();
loadLeaderboard();
