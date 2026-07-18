export const BOARD_SIZE = 4;

export function createSolvedTiles(size = BOARD_SIZE) {
  return Array.from({ length: size * size }, (_, index) =>
    index === size * size - 1 ? 0 : index + 1
  );
}

export function shuffleTiles(size = BOARD_SIZE, random = Math.random) {
  const shuffled = createSolvedTiles(size).slice();

  do {
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
  } while (!isSolvable(shuffled, size) || isSolved(shuffled));

  return shuffled;
}

export function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function getRow(index, size = BOARD_SIZE) {
  return Math.floor(index / size);
}

export function getColumn(index, size = BOARD_SIZE) {
  return index % size;
}

export function areAdjacent(firstIndex, secondIndex, size = BOARD_SIZE) {
  const rowDistance = Math.abs(getRow(firstIndex, size) - getRow(secondIndex, size));
  const columnDistance = Math.abs(getColumn(firstIndex, size) - getColumn(secondIndex, size));
  return rowDistance + columnDistance === 1;
}

export function isSolved(tileSet) {
  return tileSet.every((value, index) => {
    if (index === tileSet.length - 1) {
      return value === 0;
    }

    return value === index + 1;
  });
}

export function countInversions(tileSet) {
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

export function isSolvable(tileSet, size = BOARD_SIZE) {
  const inversions = countInversions(tileSet);
  const emptyRowFromBottom = size - getRow(tileSet.indexOf(0), size);

  if (size % 2 !== 0) {
    return inversions % 2 === 0;
  }

  return (emptyRowFromBottom % 2 === 0) !== (inversions % 2 === 0);
}

export function swapTiles(tileSet, firstIndex, secondIndex) {
  const nextTiles = tileSet.slice();
  [nextTiles[firstIndex], nextTiles[secondIndex]] = [nextTiles[secondIndex], nextTiles[firstIndex]];
  return nextTiles;
}
