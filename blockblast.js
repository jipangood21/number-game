/**
 * Block Blast 핵심 게임 로직
 */

const BLOCKBLAST_BOARD_SIZE = 8;

const BLOCK_SHAPES = {
  // Easy: 7가지 표준 테트리스 테트로미노 (모든 회전 포함)
  easy: [
    // I
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    // O
    [[1, 1], [1, 1]],
    // T
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
    // S
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
    // Z
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
    // J
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]],
    // L
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]],
  ],
  // Normal: 5~6칸 펜토미노 및 커스텀 도형
  normal: [
    [[1, 1, 1, 1, 1]],                        // I5 가로
    [[1], [1], [1], [1], [1]],                 // I5 세로
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]],         // 십자(+)
    [[1, 0, 1], [1, 1, 1]],                    // U (가로)
    [[1, 1], [1, 0], [1, 1]],                  // C (세로)
    [[1, 1], [1, 1], [1, 0]],                  // P형
    [[1, 1], [1, 1], [0, 1]],                  // P형 미러
    [[1, 1, 0], [0, 1, 0], [0, 1, 1]],         // S형 지그재그
    [[0, 1, 1], [0, 1, 0], [1, 1, 0]],         // Z형 지그재그
    [[1, 1, 1], [1, 1, 1]],                    // 2×3 직사각형
  ],
  // Hard: 6~9칸 대형 복합 도형
  hard: [
    [[1, 1, 1, 1], [1, 1, 1, 1]],             // 2×4 직사각형
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]],         // 3×3 정사각형
    [[1, 0], [1, 0], [1, 0], [1, 1]],          // 대형 L
    [[0, 1], [0, 1], [0, 1], [1, 1]],          // 대형 J
    [[1, 1, 1], [1, 0, 0], [1, 0, 0]],         // 코너 L
    [[1, 1, 1], [0, 0, 1], [0, 0, 1]],         // 코너 J
    [[1, 0, 1], [1, 0, 1], [1, 1, 1]],         // 대형 U
    [[1, 1, 1, 1, 1], [0, 0, 1, 0, 0]],        // 대형 T (가로)
    [[0, 1, 0], [0, 1, 0], [1, 1, 1], [0, 1, 0]], // 대형 T (세로)
    [[1, 0, 0], [1, 1, 0], [0, 1, 1], [0, 0, 1]], // 대각 계단
  ],
};

const BLOCK_COLORS = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "cyan"];

/** 블록 블래스트 난이도 선택 화면 렌더링 */
function renderBlockblastDifficultySelect() {
  blockblastDifficultyOptionsEl.innerHTML = BLOCKBLAST_DIFFICULTIES.map((diff) => {
    const recordLine = getRecordMetaLine("blockblast", diff.key, null);
    return `
      <button type="button" class="option-btn" data-difficulty="${diff.key}">
        <span class="label">${t(diff.nameKey)}</span>
        <span class="meta-wrap">
          <span class="record-meta">${recordLine}</span>
        </span>
      </button>
    `;
  }).join("");

  blockblastDifficultyOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => startBlockblastGame(btn.dataset.difficulty));
  });
}

/** 점수 표시 업데이트 */
function updateBlockblastScoreDisplay() {
  blockblastCurrentScoreEl.textContent = blockblastState.score;
  blockblastBestScoreEl.textContent = blockblastState.bestScore;
}

/** 보드 렌더링 (innerHTML 일괄 처리로 성능 개선) */
function renderBlockblastBoard() {
  let html = "";
  for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r += 1) {
    for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c += 1) {
      const color = blockblastState.board[r][c];
      const colorClass = color ? ` filled block-color-${color}` : "";
      html += `<div class="blockblast-cell${colorClass}" data-row="${r}" data-col="${c}"></div>`;
    }
  }
  blockblastBoardEl.innerHTML = html;
}

/** 블록 조각들 렌더링 */
function renderBlockblastPieces() {
  blockblastPiecesEl.innerHTML = "";
  blockblastState.pieces.forEach((piece, index) => {
    if (piece.placed) return;

    const pieceEl = document.createElement("div");
    pieceEl.className = `block-piece block-color-${piece.color}`;
    pieceEl.dataset.index = index;
    pieceEl.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;

    piece.shape.forEach((row) => {
      row.forEach((cell) => {
        const cellEl = document.createElement("div");
        cellEl.className = "piece-cell" + (cell ? " filled" : "");
        pieceEl.appendChild(cellEl);
      });
    });

    initPieceDragEvents(pieceEl, piece, index);
    blockblastPiecesEl.appendChild(pieceEl);
  });
}

// 드래그 상태 (전역 — 한 번에 하나의 조각만 조작 가능)
let activeDragElement = null;
let activeDragPiece = null;
let activeDragIndex = null;
let activeDragOffsetX = 0;
let activeDragOffsetY = 0;
const DRAG_VISUAL_OFFSET_Y = 40;

function updateDragElementPosition(element, clientX, clientY) {
  const targetX = clientX - activeDragOffsetX;
  const targetY = clientY - activeDragOffsetY - DRAG_VISUAL_OFFSET_Y;
  element.style.left = "0px";
  element.style.top = "0px";
  element.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.0)`;
}

function handleDragMove(e) {
  if (!activeDragElement) return;
  if (e.cancelable) e.preventDefault();
  const touch = e.type === "touchmove" ? e.touches[0] : e;
  updateDragElementPosition(activeDragElement, touch.clientX, touch.clientY);
  updatePlacementPreview(
    activeDragElement,
    activeDragPiece,
    touch.clientX,
    touch.clientY - DRAG_VISUAL_OFFSET_Y,
    activeDragOffsetX,
    activeDragOffsetY
  );
}

function handleDragEnd(e) {
  if (!activeDragElement) return;
  const touch = e.type === "touchend" ? e.changedTouches[0] : e;
  const finalX = touch.clientX;
  const finalY = touch.clientY - DRAG_VISUAL_OFFSET_Y;

  // activeDragElement 해제 전에 값 복사
  const el = activeDragElement;
  const piece = activeDragPiece;
  const index = activeDragIndex;
  const offsetX = activeDragOffsetX;
  const offsetY = activeDragOffsetY;

  activeDragElement = null;
  el.classList.remove("dragging");
  el.style.left = "";
  el.style.top = "";
  el.style.transform = "";
  document.body.style.overflow = "";

  const pos = calculateBoardPosition(piece, finalX, finalY, offsetX, offsetY);
  if (pos && canPlacePiece(pos.row, pos.col, piece.shape)) {
    placePiece(pos.row, pos.col, piece, index);
  } else {
    clearPreview();
  }
}

// 전역 드래그 핸들러를 한 번만 등록 (renderBlockblastPieces 호출 시 누적 방지)
window.addEventListener("mousemove", handleDragMove);
window.addEventListener("mouseup", handleDragEnd);
window.addEventListener("touchmove", handleDragMove, { passive: false });
window.addEventListener("touchend", handleDragEnd);

/** 피스 드래그 이벤트 초기화 (mousedown/touchstart만 엘리먼트에 등록) */
function initPieceDragEvents(el, piece, index) {
  const onStart = (e) => {
    if (activeDragElement || blockblastState.gameOver) return;
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const touch = e.type === "touchstart" ? e.touches[0] : e;
    const rect = el.getBoundingClientRect();
    activeDragOffsetX = touch.clientX - rect.left;
    activeDragOffsetY = touch.clientY - rect.top;
    activeDragPiece = piece;
    activeDragIndex = index;
    activeDragElement = el;

    el.classList.add("dragging");
    updateDragElementPosition(el, touch.clientX, touch.clientY);
    document.body.style.overflow = "hidden";
  };

  el.addEventListener("mousedown", onStart);
  el.addEventListener("touchstart", onStart, { passive: false });
}

/** 현재 드래그 중인 위치를 보드 좌표로 계산 */
function calculateBoardPosition(piece, clientX, clientY, dragOffsetX, dragOffsetY) {
  const boardRect = blockblastBoardEl.getBoundingClientRect();
  const cellSize = boardRect.width / BLOCKBLAST_BOARD_SIZE;

  const pieceTopLeftX = clientX - dragOffsetX;
  const pieceTopLeftY = clientY - dragOffsetY;

  const row = Math.round((pieceTopLeftY - boardRect.top) / cellSize);
  const col = Math.round((pieceTopLeftX - boardRect.left) / cellSize);

  if (row >= 0 && row <= BLOCKBLAST_BOARD_SIZE - piece.shape.length &&
      col >= 0 && col <= BLOCKBLAST_BOARD_SIZE - piece.shape[0].length) {
    return { row, col };
  }
  return null;
}

/** 배치 가능 여부 프리뷰 업데이트 */
function updatePlacementPreview(el, piece, clientX, clientY, dragOffsetX, dragOffsetY) {
  clearPreview();
  const pos = calculateBoardPosition(piece, clientX, clientY, dragOffsetX, dragOffsetY);
  if (pos && canPlacePiece(pos.row, pos.col, piece.shape)) {
    for (let r = 0; r < piece.shape.length; r += 1) {
      for (let c = 0; c < piece.shape[0].length; c += 1) {
        if (piece.shape[r][c]) {
          const boardCell = blockblastBoardEl.querySelector(`[data-row="${pos.row + r}"][data-col="${pos.col + c}"]`);
          if (boardCell) {
            boardCell.classList.add("preview");
            boardCell.classList.add(`block-color-${piece.color}`);
          }
        }
      }
    }
  }
}

function clearPreview() {
  blockblastBoardEl.querySelectorAll(".preview").forEach(cell => {
    cell.classList.remove("preview");
    BLOCK_COLORS.forEach(color => cell.classList.remove(`block-color-${color}`));
  });
}

/** 블록 배치 가능 여부 체크 */
function canPlacePiece(row, col, shape) {
  for (let r = 0; r < shape.length; r += 1) {
    for (let c = 0; c < shape[0].length; c += 1) {
      if (shape[r][c]) {
        if (blockblastState.board[row + r][col + c]) return false;
      }
    }
  }
  return true;
}

/** 블록 배치 실행 */
function placePiece(row, col, piece, index) {
  for (let r = 0; r < piece.shape.length; r += 1) {
    for (let c = 0; c < piece.shape[0].length; c += 1) {
      if (piece.shape[r][c]) {
        blockblastState.board[row + r][col + c] = piece.color;
      }
    }
  }

  piece.placed = true;
  blockblastState.score += countFilledCells(piece.shape);

  clearPreview();
  checkAndClearLines();
  updateBlockblastScoreDisplay();
  renderBlockblastBoard();

  if (blockblastState.pieces.every(p => p.placed)) {
    generateNewPieces();
  }

  renderBlockblastPieces();

  if (isGameOver()) {
    handleBlockblastGameOver();
  }
}

function countFilledCells(shape) {
  return shape.flat().filter(v => v).length;
}

/** 가득 찬 행과 열을 찾아 제거 */
function checkAndClearLines() {
  const rowsToClear = [];
  const colsToClear = [];

  for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r += 1) {
    if (blockblastState.board[r].every(cell => cell !== 0)) {
      rowsToClear.push(r);
    }
  }

  for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c += 1) {
    let full = true;
    for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r += 1) {
      if (blockblastState.board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  if (rowsToClear.length > 0 || colsToClear.length > 0) {
    const totalLines = rowsToClear.length + colsToClear.length;

    blockblastBoardEl.classList.remove("board-impact");
    void blockblastBoardEl.offsetWidth;
    blockblastBoardEl.classList.add("board-impact");

    blockblastState.combo += 1;
    const baseScore = totalLines * 1000;
    const comboBonus = (blockblastState.combo > 1) ? (blockblastState.combo * 500) : 0;
    const addedScore = baseScore + comboBonus;

    blockblastState.score += addedScore;

    if (blockblastState.combo > 1) {
      blockblastMessageEl.textContent = t("blockblast.combo", { n: blockblastState.combo });
    }

    rowsToClear.forEach(r => {
      showScorePopup(r, 4, 1000 + (blockblastState.combo > 1 ? 500 : 0));
      for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c += 1) {
        const color = blockblastState.board[r][c];
        blockblastState.board[r][c] = 0;
        animateCellClear(r, c, color);
      }
    });

    colsToClear.forEach(c => {
      if (!rowsToClear.includes(4)) {
        showScorePopup(4, c, 1000 + (blockblastState.combo > 1 ? 500 : 0));
      }
      for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r += 1) {
        if (blockblastState.board[r][c] !== 0) {
          const color = blockblastState.board[r][c];
          blockblastState.board[r][c] = 0;
          animateCellClear(r, c, color);
        }
      }
    });
  } else {
    blockblastState.combo = 0;
    blockblastMessageEl.textContent = "";
  }
}

function animateCellClear(r, c, originalColor) {
  const cell = blockblastBoardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  if (cell) {
    if (originalColor) {
      cell.classList.add(`block-color-${originalColor}`);
      cell.classList.add("filled");
    }
    cell.classList.add("clearing");

    setTimeout(() => {
      cell.className = "blockblast-cell";
    }, 700);
  }
}

/** 점수 팝업 애니메이션 표시 */
function showScorePopup(row, col, score) {
  const cellEl = blockblastBoardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cellEl) return;

  const rect = cellEl.getBoundingClientRect();
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = `+${score}`;

  popup.style.left = `${rect.left + rect.width / 2}px`;
  popup.style.top = `${rect.top}px`;

  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 1000);
}

/** 게임 종료 여부 판정 (어떤 피스도 놓을 수 없는 경우) */
function isGameOver() {
  const remainingPieces = blockblastState.pieces.filter(p => !p.placed);
  if (remainingPieces.length === 0) return false;

  for (const piece of remainingPieces) {
    for (let r = 0; r <= BLOCKBLAST_BOARD_SIZE - piece.shape.length; r += 1) {
      for (let c = 0; c <= BLOCKBLAST_BOARD_SIZE - piece.shape[0].length; c += 1) {
        if (canPlacePiece(r, c, piece.shape)) {
          return false;
        }
      }
    }
  }
  return true;
}

function blockblastRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 새로운 블록 피스 3개 생성 */
function generateNewPieces() {
  const pool = getPiecePool(blockblastState.difficultyKey);
  blockblastState.pieces = [];

  let availableColors = [...BLOCK_COLORS];

  for (let i = 0; i < 3; i += 1) {
    const shape = pool[blockblastRandomInt(0, pool.length - 1)];
    const colorIndex = blockblastRandomInt(0, availableColors.length - 1);
    const color = availableColors.splice(colorIndex, 1)[0];
    blockblastState.pieces.push({ shape, color, placed: false });
  }
}

function getPiecePool(difficulty) {
  let pool = [...BLOCK_SHAPES.easy];
  if (difficulty === "normal") pool = [...pool, ...BLOCK_SHAPES.normal];
  if (difficulty === "hard") pool = [...pool, ...BLOCK_SHAPES.normal, ...BLOCK_SHAPES.hard];
  return pool;
}

/** 게임 시작 */
function startBlockblastGame(difficultyKey) {
  const appEl = document.querySelector(".app");
  if (appEl) appEl.classList.add("app--blockblast");

  blockblastState = {
    board: Array.from({ length: BLOCKBLAST_BOARD_SIZE }, () => Array(BLOCKBLAST_BOARD_SIZE).fill(0)),
    score: 0,
    bestScore: getBestRecord("blockblast", difficultyKey, null) || 0,
    combo: 0,
    difficultyKey,
    pieces: [],
    gameOver: false,
  };

  blockblastDifficultyBadge.textContent = t(`blockblast.difficulty.${difficultyKey}`);
  blockblastMessageEl.textContent = "";
  generateNewPieces();
  updateBlockblastScoreDisplay();
  renderBlockblastBoard();
  renderBlockblastPieces();
  showScreen("blockblastPlay");
}

/** 게임 종료 처리 */
function handleBlockblastGameOver() {
  blockblastState.gameOver = true;
  blockblastMessageEl.textContent = t("blockblast.gameOver");

  lastResultGameId = "blockblast";
  lastResultWon = true;

  setTimeout(() => {
    const appEl = document.querySelector(".app");
    if (appEl) appEl.classList.remove("app--blockblast");

    resultTitle.textContent = t("blockblast.title");
    resultMessage.textContent = t("blockblast.gameOver");
    const details = [
      t(`blockblast.difficulty.${blockblastState.difficultyKey}`),
      t("blockblast.score") + " " + blockblastState.score
    ];

    const recordResult = tryUpdateRecord({
      gameId: "blockblast",
      difficultyKey: blockblastState.difficultyKey,
      digits: null,
      value: blockblastState.score,
      metric: "score",
    });

    resultDetail.textContent = appendRecordToResult(details, recordResult).join(" · ");
    showScreen("result");
  }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  const resetAppWidth = () => {
    const appEl = document.querySelector(".app");
    if (appEl) appEl.classList.remove("app--blockblast");
    goHome();
  };

  btnBlockblastBackHome.addEventListener("click", resetAppWidth);
  btnBlockblastPlayBackHome.addEventListener("click", resetAppWidth);
});
