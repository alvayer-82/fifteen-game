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

const size = 4;
const leaderboardPageSize = 10;
const supabaseConfig = window.SUPABASE_CONFIG ?? {};
const hasSupabaseConfig =
  typeof window.supabase !== "undefined" &&
  typeof supabaseConfig.url === "string" &&
  typeof supabaseConfig.anonKey === "string" &&
  !supabaseConfig.url.includes("PASTE_YOUR_SUPABASE_URL_HERE") &&
  !supabaseConfig.anonKey.includes("PASTE_YOUR_SUPABASE_ANON_KEY_HERE");
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;
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

function createSolvedTiles() {
  return Array.from({ length: size * size }, (_, index) =>
    index === size * size - 1 ? 0 : index + 1
  );
}

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

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setMessage(text) {
  messageElement.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSortIndicator(key) {
  if (leaderboardSort.key !== key) {
    return "";
  }

  return leaderboardSort.direction === "asc" ? "▲" : "▼";
}

function compareRecords(first, second) {
  if (leaderboardSort.key === "player") {
    const byPlayer = first.player.localeCompare(second.player, "ru", { sensitivity: "base" });
    if (byPlayer !== 0) {
      return leaderboardSort.direction === "asc" ? byPlayer : -byPlayer;
    }
  }

  if (leaderboardSort.key === "moves") {
    const byMoves = first.moves - second.moves;
    if (byMoves !== 0) {
      return leaderboardSort.direction === "asc" ? byMoves : -byMoves;
    }
  }

  if (leaderboardSort.key === "time") {
    const byTime = first.time - second.time;
    if (byTime !== 0) {
      return leaderboardSort.direction === "asc" ? byTime : -byTime;
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

function getSortedLeaderboardRecords(records) {
  return records.slice().sort(compareRecords);
}

function getLeaderboardPageCount(records) {
  return Math.max(1, Math.ceil(records.length / leaderboardPageSize));
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

  const sortedRecords = getSortedLeaderboardRecords(records);
  const totalPages = getLeaderboardPageCount(sortedRecords);
  leaderboardPage = Math.min(Math.max(1, leaderboardPage), totalPages);
  const startIndex = (leaderboardPage - 1) * leaderboardPageSize;
  const pagedRecords = sortedRecords.slice(startIndex, startIndex + leaderboardPageSize);
  const rows = pagedRecords
    .map((record, index) => `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">#${startIndex + index + 1}</span>
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
          <span class="leaderboard-sort-indicator">${getSortIndicator("player")}</span>
        </button>
      </span>
      <span class="leaderboard-metric">
        <button class="leaderboard-sort" type="button" data-sort-key="moves">
          Ходы
          <span class="leaderboard-sort-indicator">${getSortIndicator("moves")}</span>
        </button>
      </span>
      <span class="leaderboard-metric">
        <button class="leaderboard-sort" type="button" data-sort-key="time">
          Время
          <span class="leaderboard-sort-indicator">${getSortIndicator("time")}</span>
        </button>
      </span>
    </div>
    ${rows}
  `;

  renderLeaderboardPagination(sortedRecords.length, leaderboardPage, totalPages);
}

function renderPlayerSuggestions(records) {
  const uniquePlayers = [...new Set(records.map((record) => record.player).filter(Boolean))];

  playerSuggestionsElement.innerHTML = uniquePlayers
    .map((player) => `<option value="${escapeHtml(player)}"></option>`)
    .join("");
}

async function loadLeaderboard() {
  if (!supabaseClient) {
    renderLeaderboard([], "Онлайн-рейтинг отключен. Подключите Supabase в файле supabase-config.js.");
    renderPlayerSuggestions([]);
    return;
  }

  renderLeaderboard([], "Загружаю общий рейтинг...");

  const { data, error } = await supabaseClient
    .from("leaderboard")
    .select("player, moves, time_seconds")
    .order("moves", { ascending: true })
    .order("time_seconds", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    renderLeaderboard([], "Не удалось загрузить рекорды. Проверьте настройки Supabase.");
    renderPlayerSuggestions([]);
    return;
  }

  const records = data.map((record) => ({
    player: record.player,
    moves: record.moves,
    time: record.time_seconds
  }));

  leaderboardRecords = records;
  leaderboardPage = 1;
  renderLeaderboard(leaderboardRecords);
  renderPlayerSuggestions(records);
}

async function saveRecord() {
  if (!supabaseClient) {
    return false;
  }

  const { error } = await supabaseClient
    .from("leaderboard")
    .insert({
      player: currentPlayer,
      moves: moveCount,
      time_seconds: secondsElapsed
    });

  if (error) {
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

function getRow(index) {
  return Math.floor(index / size);
}

function getColumn(index) {
  return index % size;
}

function areAdjacent(firstIndex, secondIndex) {
  const rowDistance = Math.abs(getRow(firstIndex) - getRow(secondIndex));
  const columnDistance = Math.abs(getColumn(firstIndex) - getColumn(secondIndex));
  return rowDistance + columnDistance === 1;
}

function swapTiles(firstIndex, secondIndex) {
  [tiles[firstIndex], tiles[secondIndex]] = [tiles[secondIndex], tiles[firstIndex]];
}

function isSolved() {
  return tiles.every((value, index) => {
    if (index === tiles.length - 1) {
      return value === 0;
    }

    return value === index + 1;
  });
}

function countInversions(tileSet) {
  const numbers = tileSet.filter((value) => value !== 0);
  let inversions = 0;

  for (let i = 0; i < numbers.length; i += 1) {
    for (let j = i + 1; j < numbers.length; j += 1) {
      if (numbers[i] > numbers[j]) {
        inversions += 1;
      }
    }
  }

  return inversions;
}

function isSolvable(tileSet) {
  const inversions = countInversions(tileSet);
  const emptyRowFromBottom = size - getRow(tileSet.indexOf(0));

  if (size % 2 !== 0) {
    return inversions % 2 === 0;
  }

  return (emptyRowFromBottom % 2 === 0) !== (inversions % 2 === 0);
}

function shuffleTiles() {
  const shuffled = createSolvedTiles().slice();

  do {
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
  } while (!isSolvable(shuffled) || isSolvedArray(shuffled));

  return shuffled;
}

function isSolvedArray(tileSet) {
  return tileSet.every((value, index) => {
    if (index === tileSet.length - 1) {
      return value === 0;
    }

    return value === index + 1;
  });
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

  tiles = shuffleTiles();
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
  const movableIndex = tiles.findIndex((value, index) => value !== 0 && areAdjacent(index, emptyIndex));

  if (movableIndex === -1) {
    return;
  }

  const tileButton = boardElement.children[movableIndex];
  tileButton.classList.add("tile-highlight");
  window.setTimeout(() => tileButton.classList.remove("tile-highlight"), 650);
}

async function handleTileClick(tileIndex) {
  const emptyIndex = getEmptyIndex();

  if (!areAdjacent(tileIndex, emptyIndex)) {
    setMessage("Можно перемещать только соседнюю с пустой ячейкой плитку.");
    return;
  }

  if (gameStarted && moveCount === 0 && secondsElapsed === 0) {
    startTimer();
  }

  swapTiles(tileIndex, emptyIndex);
  moveCount += 1;
  renderBoard();
  updateStats();

  if (isSolved()) {
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
  const row = getRow(emptyIndex);
  const column = getColumn(emptyIndex);

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
      direction: nextSortKey === "player" ? "asc" : "asc"
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
  const totalPages = getLeaderboardPageCount(leaderboardRecords);

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

tiles = createSolvedTiles();
renderBoard();
updateStats();
loadLeaderboard();
