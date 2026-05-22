const SUDOKU_SIZE = 9;
const SUDOKU_CELLS = 81;

const SUDOKU_CLUES = {
  easy: 46,
  normal: 36,
  hard: 26,
};

function sudokuIdx(row, col) {
  return row * SUDOKU_SIZE + col;
}

function sudokuRow(idx) {
  return Math.floor(idx / SUDOKU_SIZE);
}

function sudokuCol(idx) {
  return idx % SUDOKU_SIZE;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isValidPlacement(board, idx, num) {
  const row = sudokuRow(idx);
  const col = sudokuCol(idx);
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < SUDOKU_SIZE; c += 1) {
    if (c !== col && board[sudokuIdx(row, c)] === num) return false;
  }
  for (let r = 0; r < SUDOKU_SIZE; r += 1) {
    if (r !== row && board[sudokuIdx(r, col)] === num) return false;
  }
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const ri = boxRow + r;
      const ci = boxCol + c;
      if (ri !== row || ci !== col) {
        if (board[sudokuIdx(ri, ci)] === num) return false;
      }
    }
  }
  return true;
}

function solveSudoku(board) {
  const empty = board.findIndex((v) => v === 0);
  if (empty === -1) return true;

  const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const num of nums) {
    if (isValidPlacement(board, empty, num)) {
      board[empty] = num;
      if (solveSudoku(board)) return true;
      board[empty] = 0;
    }
  }
  return false;
}

function generateSolvedBoard() {
  const board = Array(SUDOKU_CELLS).fill(0);
  const firstRow = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let c = 0; c < SUDOKU_SIZE; c += 1) {
    board[sudokuIdx(0, c)] = firstRow[c];
  }
  solveSudoku(board);
  return board;
}

function generateSudokuPuzzle(difficultyKey) {
  const solution = generateSolvedBoard();
  const puzzle = [...solution];
  const clues = SUDOKU_CLUES[difficultyKey] || SUDOKU_CLUES.normal;
  const removeCount = SUDOKU_CELLS - clues;
  const indices = shuffleArray(Array.from({ length: SUDOKU_CELLS }, (_, i) => i));

  for (let i = 0; i < removeCount; i += 1) {
    puzzle[indices[i]] = 0;
  }

  return { puzzle, solution };
}

function createEmptyNotes() {
  return Array.from({ length: SUDOKU_CELLS }, () => new Set());
}

function boardsEqual(a, b) {
  return a.every((v, i) => v === b[i]);
}

function findConflicts(board, idx) {
  const num = board[idx];
  if (!num) return [];
  const conflicts = new Set();
  const row = sudokuRow(idx);
  const col = sudokuCol(idx);
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < SUDOKU_SIZE; c += 1) {
    const i = sudokuIdx(row, c);
    if (i !== idx && board[i] === num) conflicts.add(i);
  }
  for (let r = 0; r < SUDOKU_SIZE; r += 1) {
    const i = sudokuIdx(r, col);
    if (i !== idx && board[i] === num) conflicts.add(i);
  }
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const i = sudokuIdx(boxRow + r, boxCol + c);
      if (i !== idx && board[i] === num) conflicts.add(i);
    }
  }
  return [...conflicts];
}

function getAllConflicts(board) {
  const conflictSet = new Set();
  for (let i = 0; i < SUDOKU_CELLS; i += 1) {
    if (board[i]) {
      findConflicts(board, i).forEach((c) => {
        conflictSet.add(i);
        conflictSet.add(c);
      });
    }
  }
  return conflictSet;
}

function isSudokuComplete(board) {
  return board.every((v) => v !== 0) && getAllConflicts(board).size === 0;
}

function findHintCell(state) {
  const candidates = [];
  for (let i = 0; i < SUDOKU_CELLS; i += 1) {
    if (state.fixed[i]) continue;
    if (state.user[i] === state.solution[i]) continue;
    candidates.push(i);
  }
  if (candidates.length === 0) return null;
  if (state.selectedCell !== null && candidates.includes(state.selectedCell)) {
    return state.selectedCell;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function toggleNote(notes, idx, num) {
  const cellNotes = notes[idx];
  if (cellNotes.has(num)) cellNotes.delete(num);
  else cellNotes.add(num);
}

function formatNotesDisplay(notesSet) {
  const arr = Array(9).fill("");
  notesSet.forEach((n) => {
    arr[n - 1] = String(n);
  });
  return arr;
}
