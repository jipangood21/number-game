/**
 * Block Blast 핵심 게임 로직
 */

const BLOCKBLAST_BOARD_SIZE = 8;

const BLOCK_SHAPES = {
  easy: [
    [[1]], // 1x1
    [[1, 1]], // 1x2
    [[1], [1]], // 2x1
    [[1, 1, 1]], // 1x3
    [[1], [1], [1]], // 3x1
    [[1, 1], [1, 1]], // 2x2 Solid
  ],
  normal: [
    [[1, 1, 1], [0, 1, 0]], // T
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
    [[1, 0], [1, 0], [1, 1]], // L
    [[0, 1], [0, 1], [1, 1]], // J
    [[1, 1, 1, 1]], // 1x4
    [[1], [1], [1], [1]], // 4x1
    [[1, 1], [1, 0]], // Mini L
    [[1, 1], [0, 1]], // Mini J
    [[1, 0, 1], [1, 1, 1]], // U-shape small
  ],
  hard: [
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3 Solid
    [[1, 1, 1, 1, 1]], // 1x5
    [[1], [1], [1], [1], [1]], // 5x1
    [[1, 1, 1, 1], [1, 1, 1, 1]], // 2x4 Solid
    [[1, 1, 1], [1, 0, 0], [1, 0, 0]], // Big L
    [[1, 1, 1], [0, 0, 1], [0, 0, 1]], // Big J
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // Plus (+)
    [[1, 0, 1], [1, 0, 1], [1, 1, 1]], // Large U
    [[1, 1, 1], [1, 0, 1], [1, 0, 1]], // Inverted U
    [[1, 1, 0], [0, 1, 0], [0, 1, 1]], // Stair case
    [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // Big T
    [[1, 1, 1], [1, 1, 1]], // 2x3 Solid
  ]
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

/** 보드 초기화 및 렌더링 */
function renderBlockblastBoard() {
  blockblastBoardEl.innerHTML = "";
  for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r++) {
    for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "blockblast-cell";
      const color = blockblastState.board[r][c];
      if (color) {
        cell.classList.add("filled");
        cell.classList.add(`block-color-${color}`);
      }
      cell.dataset.row = r;
      cell.dataset.col = c;
      blockblastBoardEl.appendChild(cell);
    }
  }
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

    // 드래그 이벤트 등록
    initPieceDragEvents(pieceEl, piece, index);
    blockblastPiecesEl.appendChild(pieceEl);
  });
}

// 드래그 중인 요소를 추적하여 다중 선택 방지
let activeDragElement = null;

/** 피스 드래그 이벤트 초기화 */
function initPieceDragEvents(el, piece, index) {
  let dragOffsetX, dragOffsetY;
  const VISUAL_OFFSET_Y = 40; // 손가락 위로 살짝만 올림

  const onStart = (e) => {
    // 이미 다른 조각을 드래그 중이거나 게임 오버면 무시
    if (activeDragElement || blockblastState.gameOver) return;
    
    // 이벤트 전파 차단 및 기본 동작 방지
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const touch = e.type === "touchstart" ? e.touches[0] : e;
    
    const rect = el.getBoundingClientRect();
    dragOffsetX = touch.clientX - rect.left;
    dragOffsetY = touch.clientY - rect.top;
    
    activeDragElement = el; // 현재 조작 요소를 전역에 등록
    el.classList.add("dragging");
    
    updateElementPosition(el, touch.clientX, touch.clientY);
    document.body.style.overflow = "hidden";
  };

  const onMove = (e) => {
    // 현재 조작 중인 요소가 아니면 무시
    if (!activeDragElement || activeDragElement !== el) return;
    
    const touch = e.type === "touchmove" ? e.touches[0] : e;
    updateElementPosition(el, touch.clientX, touch.clientY);
    
    updatePlacementPreview(el, piece, touch.clientX, touch.clientY - VISUAL_OFFSET_Y, dragOffsetX, dragOffsetY);
  };

  const onEnd = (e) => {
    if (!activeDragElement || activeDragElement !== el) return;
    
    // 상태 초기화 전 데이터 추출
    const touch = e.type === "touchend" ? e.changedTouches[0] : e;
    const finalX = touch.clientX;
    const finalY = touch.clientY - VISUAL_OFFSET_Y;

    // 조작 상태 즉시 해제 (다중 선택 방지)
    activeDragElement = null;
    el.classList.remove("dragging");
    el.style.left = "";
    el.style.top = "";
    el.style.transform = "";
    document.body.style.overflow = "";

    const pos = calculateBoardPosition(piece, finalX, finalY, dragOffsetX, dragOffsetY);
    if (pos && canPlacePiece(pos.row, pos.col, piece.shape)) {
      placePiece(pos.row, pos.col, piece, index);
    } else {
      clearPreview();
    }
  };

  function updateElementPosition(element, x, y) {
    const targetX = x - dragOffsetX;
    const targetY = y - dragOffsetY - VISUAL_OFFSET_Y;
    element.style.left = "0px";
    element.style.top = "0px";
    // translate와 scale을 합쳐서 설정 (CSS 충돌 방지)
    element.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.0)`;
  }

  el.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  el.addEventListener("touchstart", onStart, { passive: false });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
}

/** 현재 드래그 중인 위치를 보드 좌표로 계산 */
function calculateBoardPosition(piece, clientX, clientY, dragOffsetX, dragOffsetY) {
  const boardRect = blockblastBoardEl.getBoundingClientRect();
  const cellSize = boardRect.width / BLOCKBLAST_BOARD_SIZE;

  // 클릭한 지점이 보드 위의 어느 셀인지 계산하고, 거기서 오프셋을 빼서 블록의 시작 좌표(row, col) 산출
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
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[0].length; c++) {
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
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        if (blockblastState.board[row + r][col + c]) return false;
      }
    }
  }
  return true;
}

/** 블록 배치 실행 */
function placePiece(row, col, piece, index) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
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

  // 모든 피스를 사용했는지 체크
  if (blockblastState.pieces.every(p => p.placed)) {
    generateNewPieces();
  }

  renderBlockblastPieces();
  
  // 게임 오버 체크
  if (isGameOver()) {
    handleBlockblastGameOver();
  }
}

function countFilledCells(shape) {
  return shape.flat().filter(v => v).length;
}

/** 가득 찬 행과 열을 찾아 제거 */
function checkAndClearLines() {
  let rowsToClear = [];
  let colsToClear = [];

  // 행 체크
  for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r++) {
    if (blockblastState.board[r].every(cell => cell !== 0)) {
      rowsToClear.push(r);
    }
  }

  // 열 체크
  for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r++) {
      if (blockblastState.board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  if (rowsToClear.length > 0 || colsToClear.length > 0) {
    const totalLines = rowsToClear.length + colsToClear.length;
    
    // 보드 진동 효과 추가
    blockblastBoardEl.classList.remove("board-impact");
    void blockblastBoardEl.offsetWidth; // reflow 트리거
    blockblastBoardEl.classList.add("board-impact");

    // 점수 체계 상향: 줄당 1000점 + 콤보 보너스
    blockblastState.combo += 1;
    const baseScore = totalLines * 1000;
    const comboBonus = (blockblastState.combo > 1) ? (blockblastState.combo * 500) : 0;
    const addedScore = baseScore + comboBonus;
    
    blockblastState.score += addedScore;
    
    if (blockblastState.combo > 1) {
      blockblastMessageEl.textContent = t("blockblast.combo", { n: blockblastState.combo });
    }

    // 애니메이션 실행 및 데이터 제거
    rowsToClear.forEach(r => {
      // 행의 중앙 즈음에 점수 팝업 표시 (먼저 실행)
      showScorePopup(r, 4, 1000 + (blockblastState.combo > 1 ? 500 : 0));
      
      for (let c = 0; c < BLOCKBLAST_BOARD_SIZE; c++) {
        const color = blockblastState.board[r][c];
        blockblastState.board[r][c] = 0;
        animateCellClear(r, c, color);
      }
    });

    colsToClear.forEach(c => {
      // 열의 중앙 즈음에 점수 팝업 표시 (행과 겹치지 않게)
      if (!rowsToClear.includes(4)) {
        showScorePopup(4, c, 1000 + (blockblastState.combo > 1 ? 500 : 0));
      }
      
      for (let r = 0; r < BLOCKBLAST_BOARD_SIZE; r++) {
        // 이미 0이어도 애니메이션을 위해 색상이 있었던 경우만 처리
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
    // 색상을 명시적으로 다시 입히고 애니메이션 클래스 추가
    if (originalColor) {
      cell.classList.add(`block-color-${originalColor}`);
      cell.classList.add("filled");
    }
    cell.classList.add("clearing");
    
    // 애니메이션 종료 후 클래스 정리
    setTimeout(() => {
      cell.className = "blockblast-cell"; // 모든 클래스 초기화
    }, 700);
  }
}

/** 점수 팝업 애니메이션 표시 */
function showScorePopup(row, col, score) {
  // 보드 내 해당 셀의 절대 좌표 계산
  const cellEl = blockblastBoardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cellEl) return;
  
  const rect = cellEl.getBoundingClientRect();
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = `+${score}`;
  
  // Viewport(화면) 기준 위치 설정 (레이어 이슈 해결)
  popup.style.left = `${rect.left + rect.width / 2}px`;
  popup.style.top = `${rect.top}px`;
  
  document.body.appendChild(popup); // 보드가 아닌 바디에 직접 추가
  
  // 애니메이션 후 제거
  setTimeout(() => popup.remove(), 1000);
}

/** 게임 종료 여부 판정 (어떤 피스도 놓을 수 없는 경우) */
function isGameOver() {
  const remainingPieces = blockblastState.pieces.filter(p => !p.placed);
  if (remainingPieces.length === 0) return false;

  for (const piece of remainingPieces) {
    for (let r = 0; r <= BLOCKBLAST_BOARD_SIZE - piece.shape.length; r++) {
      for (let c = 0; c <= BLOCKBLAST_BOARD_SIZE - piece.shape[0].length; c++) {
        if (canPlacePiece(r, c, piece.shape)) {
          return false; // 놓을 수 있는 곳이 하나라도 있으면 게임 계속
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
  
  // 가용한 색상 복사
  let availableColors = [...BLOCK_COLORS];
  
  for (let i = 0; i < 3; i++) {
    const shape = pool[blockblastRandomInt(0, pool.length - 1)];
    
    // 무작위 색상 선택 및 제거 (서로 다른 색상을 갖도록)
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
  // 앱 폭 확장
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
  lastResultWon = true; // 블록 블래스트는 '승리' 개념보다 기록 갱신

  setTimeout(() => {
    // 앱 폭 원복 (결과 화면은 좁게)
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

// 초기화 시 내비게이션 버튼 리스너 등록
document.addEventListener("DOMContentLoaded", () => {
  const resetAppWidth = () => {
    const appEl = document.querySelector(".app");
    if (appEl) appEl.classList.remove("app--blockblast");
    goHome();
  };

  btnBlockblastBackHome.addEventListener("click", resetAppWidth);
  btnBlockblastPlayBackHome.addEventListener("click", resetAppWidth);
});
