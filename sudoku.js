/**
 * 스도쿠 게임 핵심 엔진
 * 퍼즐 생성(백트래킹), 유효성 검증, 힌트 및 메모 기능을 담당합니다.
 */

const SUDOKU_SIZE = 9;
const SUDOKU_CELLS = 81;

/** 난이도별 초기 힌트 셀 개수 */
const SUDOKU_CLUES = {
  easy: 46,
  normal: 36,
  hard: 26,
};

/** 행/열 좌표를 1차원 인덱스로 변환 */
function sudokuIdx(row, col) {
  return row * SUDOKU_SIZE + col;
}

/** 1차원 인덱스에서 행 좌표 추출 */
function sudokuRow(idx) {
  return Math.floor(idx / SUDOKU_SIZE);
}

/** 1차원 인덱스에서 열 좌표 추출 */
function sudokuCol(idx) {
  return idx % SUDOKU_SIZE;
}

/** 배열 무작위 셔플 (퍼즐 생성 시 사용) */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 특정 위치에 숫자를 놓을 수 있는지 유효성 검사 (가로, 세로, 3x3 박스 중복 체크) */
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

/** 백트래킹 알고리즘을 사용한 스도쿠 해법 탐색 */
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

/** 정답이 채워진 스도쿠 판 생성 */
function generateSolvedBoard() {
  const board = Array(SUDOKU_CELLS).fill(0);
  const firstRow = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let c = 0; c < SUDOKU_SIZE; c += 1) {
    board[sudokuIdx(0, c)] = firstRow[c];
  }
  solveSudoku(board);
  return board;
}

/** 난이도에 맞는 스도쿠 퍼즐(문제판) 생성 */
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

/** 비어 있는 메모(노트) 데이터 구조 생성 */
function createEmptyNotes() {
  return Array.from({ length: SUDOKU_CELLS }, () => new Set());
}

/** 두 보드판의 내용이 완벽히 일치하는지 비교 */
function boardsEqual(a, b) {
  return a.every((v, i) => v === b[i]);
}

/** 특정 셀과 규칙 위반(중복)이 발생하는 다른 셀들의 인덱스 탐색 */
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

/** 판 전체의 모든 충돌(오답) 인덱스 집합 반환 */
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

/** 스도쿠 보드가 빈칸 없이 완벽히 채워졌는지 확인 */
function isSudokuComplete(board) {
  return board.every((v) => v !== 0) && getAllConflicts(board).size === 0;
}

/** 아직 채워지지 않았거나 틀린 셀 중에서 힌트를 줄 셀 선택 */
function findHintCell(state) {
  const candidates = [];
  for (let i = 0; i < SUDOKU_CELLS; i += 1) {
    if (state.fixed[i]) continue;
    if (state.user[i] === state.solution[i]) continue;
    candidates.push(i);
  }
  if (candidates.length === 0) return null;
  // 현재 선택된 셀이 오답이면 우선적으로 힌트 제공
  if (state.selectedCell !== null && candidates.includes(state.selectedCell)) {
    return state.selectedCell;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** 특정 셀의 메모(노트) 숫자 토글 */
function toggleNote(notes, idx, num) {
  const cellNotes = notes[idx];
  if (cellNotes.has(num)) cellNotes.delete(num);
  else cellNotes.add(num);
}

/** 메모 목록을 화면 표시용 배열로 변환 */
function formatNotesDisplay(notesSet) {
  const arr = Array(9).fill("");
  notesSet.forEach((n) => {
    arr[n - 1] = String(n);
  });
  return arr;
}
