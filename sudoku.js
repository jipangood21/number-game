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

/** 보드 상태로부터 행/열/박스 비트마스크 배열 구성 (O(81)) */
function buildConstraintMasks(board) {
  const rows = new Array(SUDOKU_SIZE).fill(0);
  const cols = new Array(SUDOKU_SIZE).fill(0);
  const boxes = new Array(SUDOKU_SIZE).fill(0);
  for (let i = 0; i < SUDOKU_CELLS; i += 1) {
    const v = board[i];
    if (!v) continue;
    const r = sudokuRow(i);
    const c = sudokuCol(i);
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const bit = 1 << v;
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
  }
  return { rows, cols, boxes };
}

/**
 * MRV(Minimum Remaining Values) + 비트마스크 백트래킹
 * - 후보 수가 가장 적은 빈 칸을 먼저 시도 → 탐색 공간 대폭 축소
 * - 비트 연산으로 유효성 검사 O(1) (기존 O(n) 루프 대체)
 */
function solveSudokuFast(board, rows, cols, boxes) {
  let minCount = 10;
  let bestIdx = -1;
  let bestUsed = 0;

  for (let i = 0; i < SUDOKU_CELLS; i += 1) {
    if (board[i] !== 0) continue;
    const r = sudokuRow(i);
    const c = sudokuCol(i);
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const used = rows[r] | cols[c] | boxes[b];
    let count = 0;
    for (let n = 1; n <= 9; n += 1) {
      if (!(used & (1 << n))) count += 1;
    }
    if (count === 0) return false; // 해당 칸에 놓을 수 없음 → 즉시 가지치기
    if (count < minCount) {
      minCount = count;
      bestIdx = i;
      bestUsed = used;
      if (count === 1) break; // 후보 1개 → 더 탐색 불필요
    }
  }

  if (bestIdx === -1) return true; // 빈 칸 없음 → 완성

  const r = sudokuRow(bestIdx);
  const c = sudokuCol(bestIdx);
  const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

  const candidates = [];
  for (let n = 1; n <= 9; n += 1) {
    if (!(bestUsed & (1 << n))) candidates.push(n);
  }
  shuffleArray(candidates); // 퍼즐 랜덤화를 위해 셔플

  for (const num of candidates) {
    const bit = 1 << num;
    board[bestIdx] = num;
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;

    if (solveSudokuFast(board, rows, cols, boxes)) return true;

    board[bestIdx] = 0;
    rows[r] &= ~bit;
    cols[c] &= ~bit;
    boxes[b] &= ~bit;
  }

  return false;
}

/** 정답이 채워진 스도쿠 판 생성 (최적화 버전) */
function generateSolvedBoard() {
  const board = Array(SUDOKU_CELLS).fill(0);
  const firstRow = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let c = 0; c < SUDOKU_SIZE; c += 1) {
    board[sudokuIdx(0, c)] = firstRow[c];
  }
  const { rows, cols, boxes } = buildConstraintMasks(board);
  solveSudokuFast(board, rows, cols, boxes);
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

// ── 저장 / 불러오기 ──────────────────────────────────────────

const SUDOKU_SAVE_KEY = "ng_sudoku_save";

function getSudokuSaveKey() {
  const userId = getCurrentUserId();
  return userId ? `${SUDOKU_SAVE_KEY}_${userId}` : `${SUDOKU_SAVE_KEY}_guest`;
}

/** 현재 게임 상태를 localStorage에 직렬화하여 저장 */
function saveSudokuState() {
  if (!sudokuState.solution.length) return;
  const data = {
    puzzle:        sudokuState.puzzle,
    solution:      sudokuState.solution,
    user:          sudokuState.user,
    fixed:         sudokuState.fixed,
    notes:         sudokuState.notes.map(s => [...s]), // Set → 배열
    hinted:        sudokuState.hinted,
    selectedCell:  sudokuState.selectedCell,
    memoMode:      sudokuState.memoMode,
    difficultyKey: sudokuState.difficultyKey,
    elapsedSeconds:sudokuState.elapsedSeconds,
    hintsUsed:     sudokuState.hintsUsed,
    maxHearts:     sudokuState.maxHearts,
    hearts:        sudokuState.hearts,
    invincible:    sudokuState.invincible,
    savedAt:       Date.now(),
  };
  try {
    localStorage.setItem(getSudokuSaveKey(), JSON.stringify(data));
  } catch { /* 저장 용량 초과 등 무시 */ }
}

/** localStorage에서 저장 데이터 복원 (없으면 null 반환) */
function loadSudokuSave() {
  try {
    const raw = localStorage.getItem(getSudokuSaveKey());
    if (!raw) return null;
    const data = JSON.parse(raw);
    data.notes = data.notes.map(arr => new Set(arr)); // 배열 → Set
    return data;
  } catch {
    return null;
  }
}

/** 완료/실패 후 저장 데이터 삭제 */
function clearSudokuSave() {
  localStorage.removeItem(getSudokuSaveKey());
}

/** 저장된 상태에서 게임 재개 */
function resumeSudokuGame(saveData) {
  stopSudokuTimer();
  sudokuState = {
    puzzle:        saveData.puzzle,
    solution:      saveData.solution,
    user:          saveData.user,
    fixed:         saveData.fixed,
    notes:         saveData.notes,
    hinted:        saveData.hinted,
    selectedCell:  saveData.selectedCell,
    memoMode:      saveData.memoMode,
    difficultyKey: saveData.difficultyKey,
    elapsedSeconds:saveData.elapsedSeconds,
    hintsUsed:     saveData.hintsUsed,
    maxHearts:     saveData.maxHearts,
    hearts:        saveData.hearts,
    invincible:    saveData.invincible,
  };

  initSudokuNumpad();
  updateSudokuMemoButton();
  updateSudokuInvincibleButtons();
  updateSudokuHeartsDisplay();
  updateSudokuStopwatchDisplay();

  // 저장된 경과 시간부터 타이머 재개 (elapsedSeconds를 0으로 리셋하지 않음)
  sudokuTimerId = setInterval(() => {
    sudokuState.elapsedSeconds += 1;
    updateSudokuStopwatchDisplay();
  }, 1000);

  setSudokuMessage("");
  renderSudokuGrid();
  showScreen("sudokuPlay");
}
