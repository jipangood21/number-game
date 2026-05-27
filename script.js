const GAMES = [
  {
    id: "guess",
    nameKey: "game.guess.name",
    descriptionKey: "game.guess.description",
    available: true,
  },
  {
    id: "baseball",
    nameKey: "game.baseball.name",
    descriptionKey: "game.baseball.description",
    available: true,
  },
  {
    id: "sudoku",
    nameKey: "game.sudoku.name",
    descriptionKey: "game.sudoku.description",
    available: true,
  },
  {
    id: "blockblast",
    nameKey: "game.blockblast.name",
    descriptionKey: "game.blockblast.description",
    available: true,
  },
  {
    id: "brickbreaker",
    nameKey: "game.brickbreaker.name",
    descriptionKey: "game.brickbreaker.description",
    available: true,
  },
];

const SUDOKU_DIFFICULTIES = [
  { key: "easy", cluesKey: "sudoku.clues.easy" },
  { key: "normal", cluesKey: "sudoku.clues.normal" },
  { key: "hard", cluesKey: "sudoku.clues.hard" },
];

const BLOCKBLAST_DIFFICULTIES = [
  { key: "easy", nameKey: "blockblast.difficulty.easy" },
  { key: "normal", nameKey: "blockblast.difficulty.normal" },
  { key: "hard", nameKey: "blockblast.difficulty.hard" },
];

const SUDOKU_MAX_HEARTS = {
  easy: 5,
  normal: 5,
  hard: 3,
};

let sudokuInvincibleMode = false;
let baseballDuplicateMode = false;

const DIGIT_OPTIONS = [
  { digits: 2, minVal: 1, maxVal: 100 },
  { digits: 3, minVal: 1, maxVal: 1000 },
  { digits: 4, minVal: 1, maxVal: 10000 },
  { digits: 5, minVal: 1, maxVal: 100000 },
  { digits: 6, minVal: 1, maxVal: 1000000 },
];

const DIFFICULTY_KEYS = [
  { key: "easy" },
  { key: "normal" },
  { key: "hard" },
  { key: "oneshot", minDigits: 3 },
  { key: "unlimited" },
];

const ATTEMPT_LIMITS = {
  2: { easy: 7, normal: 5, hard: 3 },
  3: { easy: 10, normal: 8, hard: 5, oneshot: 1 },
  4: { easy: 20, normal: 15, hard: 10, oneshot: 1 },
  5: { easy: 25, normal: 20, hard: 15, oneshot: 1 },
  6: { easy: 30, normal: 25, hard: 20, oneshot: 1 },
};

let currentHeaderMode = "home";
let currentGameId = null;
let selectedDigit = null;
let lastResultWon = null;
let lastResultGameId = null;

let gameState = {
  answer: 0,
  attempts: 0,
  maxAttempts: null,
  unlimited: false,
  minVal: 1,
  maxVal: 100,
  digits: 2,
  difficultyKey: "easy",
};

let baseballState = {
  answer: 0,
  attempts: 0,
  minVal: 1,
  maxVal: 100,
  digits: 3,
  elapsedSeconds: 0,
  hintKeys: new Set(),
  digitHints: [],
};

let baseballTimerId = null;

let sudokuState = {
  puzzle: [],
  solution: [],
  user: [],
  fixed: [],
  notes: [],
  hinted: [],
  selectedCell: null,
  memoMode: false,
  difficultyKey: "easy",
  elapsedSeconds: 0,
  hintsUsed: 0,
  maxHearts: 5,
  hearts: 5,
  invincible: false,
};

let sudokuTimerId = null;
let sudokuCellEls = null; // 셀 DOM 참조 캐시 (최초 1회 생성 후 재사용)

let blockblastState = {
  board: [],
  score: 0,
  bestScore: 0,
  combo: 0,
  difficultyKey: "easy",
  pieces: [],
  gameOver: false,
};

const screens = {
  home: document.getElementById("screen-home"),
  select: document.getElementById("screen-select"),
  difficulty: document.getElementById("screen-difficulty"),
  play: document.getElementById("screen-play"),
  baseballSelect: document.getElementById("screen-baseball-select"),
  baseballPlay: document.getElementById("screen-baseball-play"),
  sudokuSelect: document.getElementById("screen-sudoku-select"),
  sudokuPlay: document.getElementById("screen-sudoku-play"),
  blockblastSelect:    document.getElementById("screen-blockblast-select"),
  blockblastPlay:      document.getElementById("screen-blockblast-play"),
  brickbreakerSelect:  document.getElementById("screen-brickbreaker-select"),
  brickbreakerPlay:    document.getElementById("screen-brickbreaker-play"),
  result:              document.getElementById("screen-result"),
};

const appEl = document.querySelector(".app");

const headerTitle = document.getElementById("header-title");
const headerSubtitle = document.getElementById("header-subtitle");
const languageToggle = document.getElementById("language-toggle");
const gameListEl = document.getElementById("game-list");
const digitOptionsEl = document.getElementById("digit-options");
const difficultyOptionsEl = document.getElementById("difficulty-options");
const difficultyDigitInfo = document.getElementById("difficulty-digit-info");
const rangeBadge = document.getElementById("range-badge");
const difficultyBadge = document.getElementById("difficulty-badge");
const attemptsLabelEl = document.getElementById("attempts-label");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const guessSubmitBtn = guessForm.querySelector('button[type="submit"]');
const feedbackEl = document.getElementById("feedback");
const historyEl = document.getElementById("history");
const resultTitle = document.getElementById("result-title");
const resultMessage = document.getElementById("result-message");
const resultDetail = document.getElementById("result-detail");
const btnReplay = document.getElementById("btn-replay");
const btnChangeDigit = document.getElementById("btn-change-digit");
const btnBackDigit = document.getElementById("btn-back-digit");
const btnBackHomeFromDigit = document.getElementById("btn-back-home-from-digit");
const btnBackHomeFromResult = document.getElementById("btn-back-home-from-result");
const baseballDigitOptionsEl = document.getElementById("baseball-digit-options");
const baseballRangeBadge = document.getElementById("baseball-range-badge");
const baseballAttemptsLabelEl = document.getElementById("baseball-attempts-label");
const baseballRuleDesc = document.getElementById("baseball-rule-desc");
const baseballForm = document.getElementById("baseball-form");
const baseballInput = document.getElementById("baseball-input");
const baseballFeedbackEl = document.getElementById("baseball-feedback");
const baseballHistoryEl = document.getElementById("baseball-history");
const baseballStopwatchEl = document.getElementById("baseball-stopwatch");
const btnBaseballHint = document.getElementById("btn-baseball-hint");
const baseballHintsEl = document.getElementById("baseball-hints");
const btnBaseballBackHome = document.getElementById("btn-baseball-back-home");
const btnBaseballDuplicateSelect = document.getElementById("btn-baseball-duplicate-select");
const btnBaseballDuplicatePlay = document.getElementById("btn-baseball-duplicate-play");
const sudokuDifficultyOptionsEl = document.getElementById("sudoku-difficulty-options");
const sudokuGridEl = document.getElementById("sudoku-grid");
const sudokuNumpadEl = document.getElementById("sudoku-numpad");
const sudokuStopwatchEl = document.getElementById("sudoku-stopwatch");
const sudokuMessageEl = document.getElementById("sudoku-message");
const btnSudokuMemo = document.getElementById("btn-sudoku-memo");
const btnSudokuHint = document.getElementById("btn-sudoku-hint");
const btnSudokuErase = document.getElementById("btn-sudoku-erase");
const btnSudokuBackHome = document.getElementById("btn-sudoku-back-home");
const btnSudokuPlayBackHome = document.getElementById("btn-sudoku-play-back-home");
const sudokuHeartsEl = document.getElementById("sudoku-hearts");
const btnSudokuInvincible = document.getElementById("btn-sudoku-invincible");
const btnSudokuInvincibleSelect = document.getElementById("btn-sudoku-invincible-select");
const blockblastDifficultyOptionsEl = document.getElementById("blockblast-difficulty-options");
const blockblastBoardEl = document.getElementById("blockblast-board");
const blockblastPiecesEl = document.getElementById("blockblast-pieces");
const blockblastCurrentScoreEl = document.getElementById("blockblast-current-score");
const blockblastBestScoreEl = document.getElementById("blockblast-best-score");
const blockblastMessageEl = document.getElementById("blockblast-message");
const blockblastDifficultyBadge = document.getElementById("blockblast-difficulty-badge");
const btnBlockblastBackHome      = document.getElementById("btn-blockblast-back-home");
const btnBlockblastPlayBackHome  = document.getElementById("btn-blockblast-play-back-home");
const btnBrickbreakerBackHome    = document.getElementById("btn-brickbreaker-back-home");
const btnBrickbreakerPlayBackHome = document.getElementById("btn-brickbreaker-play-back-home");
const btnBBPause                 = document.getElementById("btn-bb-pause");

function getActiveScreenName() {
  return Object.entries(screens).find(([, el]) => el.classList.contains("active"))?.[0];
}

function setHeader(mode) {
  currentHeaderMode = mode;
  headerTitle.textContent = t(`${mode}.title`);
  headerSubtitle.textContent = t(`${mode}.subtitle`);
}

function applyStaticTranslations() {
  document.title = t("pageTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  languageToggle.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.textContent = t(`lang.${btn.dataset.lang}`);
    btn.classList.toggle("active", btn.dataset.lang === getLanguage());
  });

  if (typeof refreshProfileTranslations === "function") {
    refreshProfileTranslations();
  }
  if (typeof refreshAuthTranslations === "function") {
    refreshAuthTranslations();
  }
  if (typeof refreshHomeNavLabel === "function") {
    refreshHomeNavLabel();
  }
  if (typeof updateVersionUI === "function") {
    updateVersionUI();
  }
}

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
  appEl.classList.toggle("app--sudoku", name === "sudokuPlay");
  if (typeof updateHomeNavVisibility === "function") {
    updateHomeNavVisibility(name);
  }
}

function goHome() {
  stopBaseballTimer();
  stopSudokuTimer();
  if (typeof exitBrickbreakerGame === "function") exitBrickbreakerGame();
  currentGameId = null;
  selectedDigit = null;
  setHeader("home");
  showScreen("home");
  renderHome();
}

function goGuessGame() {
  currentGameId = "guess";
  setHeader("guess");
  showScreen("select");
  renderDigitSelect();
}

function goBaseballGame() {
  currentGameId = "baseball";
  setHeader("baseball");
  showScreen("baseballSelect");
  renderBaseballDigitSelect();
}

function goSudokuGame() {
  currentGameId = "sudoku";
  setHeader("sudoku");
  showScreen("sudokuSelect");
  renderSudokuDifficultySelect();
}

function goBlockblastGame() {
  currentGameId = "blockblast";
  setHeader("blockblast");
  showScreen("blockblastSelect");
  renderBlockblastDifficultySelect();
}

function goBrickbreakerGame() {
  currentGameId = "brickbreaker";
  setHeader("brickbreaker");
  showScreen("brickbreakerSelect");
  renderBrickbreakerDifficultySelect();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAvailableDifficulties(digits) {
  return DIFFICULTY_KEYS.filter((d) => !d.minDigits || digits >= d.minDigits);
}

function getMaxAttempts(digits, difficultyKey) {
  if (difficultyKey === "unlimited") return null;
  return ATTEMPT_LIMITS[digits][difficultyKey];
}

function getDifficultyName(difficultyKey) {
  return t(`difficulty.${difficultyKey}`);
}

/** 자릿수를 수의 범위 텍스트로 변환 (예: 2 -> "1 ~ 100") */
function getDigitLabel(digits) {
  const opt = DIGIT_OPTIONS.find((d) => d.digits === digits);
  if (opt) {
    return `${formatNumber(opt.minVal)} ~ ${formatNumber(opt.maxVal)}`;
  }
  return t("digit.unit", { n: digits });
}

function getDifficultyMeta(digits, difficultyKey) {
  if (difficultyKey === "unlimited") return t("difficulty.noLimit");
  const maxAttempts = getMaxAttempts(digits, difficultyKey);
  return maxAttempts === 1
    ? t("difficulty.oneLimit")
    : t("difficulty.withinAttempts", { n: maxAttempts });
}

function getDifficultyBadgeText(difficultyKey, maxAttempts, unlimited) {
  const name = getDifficultyName(difficultyKey);
  if (unlimited) return t("difficulty.badge.unlimited", { name });
  if (maxAttempts === 1) return t("difficulty.badge.one", { name });
  return t("difficulty.badge.attempts", { name, n: maxAttempts });
}

/** 횟수맞추기 게임의 시도 횟수 표시 업데이트 */
function updateAttemptsDisplay() {
  if (gameState.unlimited) {
    const count = formatAttemptsUnit(gameState.attempts);
    attemptsLabelEl.innerHTML = `${t("play.attempts")} <strong>${count}</strong>`;
    return;
  }
  const remaining = gameState.maxAttempts - gameState.attempts;
  attemptsLabelEl.innerHTML = `${t("play.remaining")} <strong>${remaining}</strong>`;
}

/** 로그인 상태 변경 시 UI 동기화 */
function onAuthStateChanged() {
  if (isLoggedIn()) loadProfileForUser();
  else loadGuestProfile();
  if (typeof renderAuthBar === "function") renderAuthBar();
  refreshCurrentScreen();
}

/** 홈 화면 게임 카드 렌더링 */
function renderHome() {
  if (typeof renderAuthBar === "function") renderAuthBar();
  gameListEl.innerHTML = GAMES.map((game) => {
    if (!game.available) {
      return `
        <div class="game-card game-card--disabled">
          <span class="label">${t(game.nameKey)}</span>
          <span class="meta">${t("game.comingSoon")}</span>
        </div>
      `;
    }
    return `
      <button type="button" class="game-card" data-game="${game.id}">
        <span class="label">${t(game.nameKey)}</span>
        <span class="meta">${t(game.descriptionKey)}</span>
      </button>
    `;
  }).join("");

  const gameHandlers = {
    guess:        goGuessGame,
    baseball:     goBaseballGame,
    sudoku:       goSudokuGame,
    blockblast:   goBlockblastGame,
    brickbreaker: goBrickbreakerGame,
  };

  gameListEl.querySelectorAll("[data-game]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameHandlers[btn.dataset.game]?.();
    });
  });
}

/** 스도쿠 안내 메시지 설정 */
function setSudokuMessage(key) {
  sudokuMessageEl.textContent = key ? t(key) : "";
}

/** 스도쿠 타이머 정지 */
function stopSudokuTimer() {
  if (sudokuTimerId !== null) {
    clearInterval(sudokuTimerId);
    sudokuTimerId = null;
  }
}

/** 스도쿠 경과 시간 표시 업데이트 */
function updateSudokuStopwatchDisplay() {
  sudokuStopwatchEl.textContent = t("sudoku.timer", { n: sudokuState.elapsedSeconds });
}

/** 스도쿠 타이머 시작 */
function startSudokuTimer() {
  stopSudokuTimer();
  sudokuState.elapsedSeconds = 0;
  updateSudokuStopwatchDisplay();
  sudokuTimerId = setInterval(() => {
    sudokuState.elapsedSeconds += 1;
    updateSudokuStopwatchDisplay();
  }, 1000);
}

/** 스도쿠 난이도별 최대 하트 수 반환 */
function getSudokuMaxHearts(difficultyKey) {
  return SUDOKU_MAX_HEARTS[difficultyKey] || 5;
}

/** 스도쿠 무적 모드 버튼 UI 업데이트 */
function updateSudokuInvincibleButtons() {
  const label = sudokuInvincibleMode ? t("sudoku.invincibleOn") : t("sudoku.invincible");
  btnSudokuInvincible.textContent = label;
  btnSudokuInvincibleSelect.textContent = label;
  btnSudokuInvincible.classList.toggle("active", sudokuInvincibleMode);
  btnSudokuInvincibleSelect.classList.toggle("active", sudokuInvincibleMode);
  if (sudokuState.solution?.length) {
    sudokuState.invincible = sudokuInvincibleMode;
  }
}

/** 스도쿠 무적 모드 토글 */
function toggleSudokuInvincibleMode() {
  sudokuInvincibleMode = !sudokuInvincibleMode;
  updateSudokuInvincibleButtons();
}

/** 스도쿠 하트(생명) UI 업데이트 */
function updateSudokuHeartsDisplay() {
  sudokuHeartsEl.innerHTML = Array.from({ length: sudokuState.maxHearts }, (_, i) => {
    const filled = i < sudokuState.hearts;
    return `<span class="heart${filled ? "" : " empty"}">♥</span>`;
  }).join("");
}

/** 스도쿠 오답 시 하트 차감 및 처리 */
function handleSudokuWrongAnswer() {
  if (sudokuState.invincible) {
    setSudokuMessage("sudoku.wrongInvincible");
    return;
  }

  sudokuState.hearts -= 1;
  updateSudokuHeartsDisplay();
  setSudokuMessage("sudoku.wrongHeart");

  if (sudokuState.hearts <= 0) {
    setTimeout(() => showSudokuFail(), 400);
  }
}

/** 스도쿠 난이도 선택 화면 렌더링 */
function renderSudokuDifficultySelect() {
  updateSudokuInvincibleButtons();

  // 저장 데이터가 있으면 '이어하기' 버튼을 최상단에 표시
  const save = loadSudokuSave();
  const continueHtml = save
    ? `<button type="button" class="option-btn option-btn--highlight" id="btn-sudoku-continue">
         <span class="label">${t("sudoku.continue")}</span>
         <span class="meta-wrap"><span class="meta">${t("sudoku.savedAt", {
           diff: t(`difficulty.${save.difficultyKey}`),
           n: save.elapsedSeconds,
         })}</span></span>
       </button>`
    : "";

  sudokuDifficultyOptionsEl.innerHTML = continueHtml + SUDOKU_DIFFICULTIES.map((diff) => {
    const recordLine = getRecordMetaLine("sudoku", diff.key, null);
    return `
    <button type="button" class="option-btn" data-difficulty="${diff.key}">
      <span class="label">${t(`difficulty.${diff.key}`)}</span>
      <span class="meta-wrap">
        <span class="meta">${t(diff.cluesKey)}</span>
        <span class="record-meta">${recordLine}</span>
      </span>
    </button>
  `;
  }).join("");

  if (save) {
    document.getElementById("btn-sudoku-continue")
      ?.addEventListener("click", () => resumeSudokuGame(save));
  }

  sudokuDifficultyOptionsEl.querySelectorAll("[data-difficulty]").forEach((btn) => {
    btn.addEventListener("click", () => startSudokuGame(btn.dataset.difficulty));
  });
}

/** 스도쿠 숫자 패드 초기화 */
function initSudokuNumpad() {
  if (sudokuNumpadEl.dataset.ready) return;
  sudokuNumpadEl.dataset.ready = "1";
  sudokuNumpadEl.innerHTML = "";

  for (let n = 1; n <= 9; n += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sudoku-num-btn";
    btn.textContent = String(n);
    btn.dataset.num = String(n);
    btn.addEventListener("click", () => applySudokuNumber(n));
    sudokuNumpadEl.appendChild(btn);
  }

  const eraseBtn = document.createElement("button");
  eraseBtn.type = "button";
  eraseBtn.className = "sudoku-num-btn";
  eraseBtn.textContent = "⌫";
  eraseBtn.addEventListener("click", eraseSudokuCell);
  sudokuNumpadEl.appendChild(eraseBtn);
}

/** 스도쿠 그리드 DOM을 최초 1회 구성하고 셀 참조 캐시 */
function buildSudokuGrid() {
  sudokuGridEl.innerHTML = "";
  sudokuCellEls = [];
  for (let idx = 0; idx < SUDOKU_CELLS; idx += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    const valueSpan = document.createElement("span");
    valueSpan.className = "sudoku-value";
    const notesDiv = document.createElement("div");
    notesDiv.className = "sudoku-notes";
    btn.appendChild(valueSpan);
    btn.appendChild(notesDiv);
    btn.addEventListener("click", () => selectSudokuCell(idx));
    sudokuGridEl.appendChild(btn);
    sudokuCellEls.push(btn);
  }
}

/**
 * 스도쿠 그리드 업데이트
 * - 기존 DOM 재사용으로 전체 innerHTML 재생성 방지
 * - 첫 호출 시에만 buildSudokuGrid()로 DOM 구성
 */
function renderSudokuGrid() {
  if (!sudokuCellEls) buildSudokuGrid();

  const conflicts = getAllConflicts(sudokuState.user);
  const selectedValue = sudokuState.selectedCell !== null
    ? sudokuState.user[sudokuState.selectedCell]
    : null;

  for (let idx = 0; idx < SUDOKU_CELLS; idx += 1) {
    const btn = sudokuCellEls[idx];
    const value = sudokuState.user[idx];
    const notes = sudokuState.notes[idx];
    const showNotes = !value && notes.size > 0;

    // 클래스를 문자열로 직접 조합 (classList.toggle 반복 대비 성능 우위)
    let cls = "sudoku-cell";
    if (sudokuState.fixed[idx])                                                cls += " fixed";
    if (sudokuState.selectedCell === idx)                                       cls += " selected";
    if (value && selectedValue && value === selectedValue && idx !== sudokuState.selectedCell) cls += " same-number";
    if (conflicts.has(idx))                                                    cls += " conflict";
    if (value && value !== sudokuState.solution[idx])                          cls += " wrong-answer";
    if (sudokuState.hinted[idx])                                               cls += " hinted";
    if (showNotes)                                                             cls += " show-notes";
    btn.className = cls;

    btn.querySelector(".sudoku-value").textContent = value || "";

    const notesDiv = btn.querySelector(".sudoku-notes");
    if (showNotes) {
      notesDiv.innerHTML = formatNotesDisplay(notes).map(n => `<span>${n}</span>`).join("");
    } else if (notesDiv.innerHTML !== "") {
      notesDiv.innerHTML = "";
    }
  }
}

/** 스도쿠 특정 셀 선택 */
function selectSudokuCell(idx) {
  sudokuState.selectedCell = idx;
  if (sudokuState.fixed[idx]) {
    setSudokuMessage("sudoku.fixedCell");
  } else {
    setSudokuMessage("");
  }
  renderSudokuGrid();
}

/** 스도쿠 메모 모드 버튼 UI 업데이트 */
function updateSudokuMemoButton() {
  btnSudokuMemo.textContent = sudokuState.memoMode ? t("sudoku.memoOn") : t("sudoku.memo");
  btnSudokuMemo.classList.toggle("active", sudokuState.memoMode);
}

/** 스도쿠 메모 모드 토글 */
function toggleSudokuMemoMode() {
  sudokuState.memoMode = !sudokuState.memoMode;
  updateSudokuMemoButton();
}

/** 스도쿠 셀에 숫자 입력 적용 */
function applySudokuNumber(num) {
  const idx = sudokuState.selectedCell;
  if (idx === null) {
    setSudokuMessage("sudoku.selectCell");
    return;
  }
  if (sudokuState.fixed[idx]) {
    setSudokuMessage("sudoku.fixedCell");
    return;
  }

  if (sudokuState.memoMode) {
    toggleNote(sudokuState.notes, idx, num);
    setSudokuMessage("");
    renderSudokuGrid();
    return;
  }

  const isWrong = sudokuState.solution[idx] !== num;

  sudokuState.user[idx] = num;
  sudokuState.notes[idx].clear();
  sudokuState.hinted[idx] = false;
  renderSudokuGrid();

  if (isWrong) {
    handleSudokuWrongAnswer();
    if (sudokuState.hearts <= 0 && !sudokuState.invincible) return;
  } else {
    setSudokuMessage("");
  }

  saveSudokuState(); // 매 입력 후 자동저장
  checkSudokuWin();
}

/** 스도쿠 셀 내용 지우기 */
function eraseSudokuCell() {
  const idx = sudokuState.selectedCell;
  if (idx === null) {
    setSudokuMessage("sudoku.selectCell");
    return;
  }
  if (sudokuState.fixed[idx]) {
    setSudokuMessage("sudoku.fixedCell");
    return;
  }

  sudokuState.user[idx] = 0;
  sudokuState.notes[idx].clear();
  sudokuState.hinted[idx] = false;
  setSudokuMessage("");
  renderSudokuGrid();
  saveSudokuState(); // 지우기 후 자동저장
}

/** 스도쿠 힌트 요청 및 자동 입력 */
function requestSudokuHint() {
  const idx = findHintCell(sudokuState);
  if (idx === null) {
    setSudokuMessage("sudoku.hint.none");
    return;
  }

  sudokuState.user[idx] = sudokuState.solution[idx];
  sudokuState.notes[idx].clear();
  sudokuState.hinted[idx] = true;
  sudokuState.hintsUsed += 1;
  sudokuState.selectedCell = idx;
  setSudokuMessage("sudoku.hint.done");
  renderSudokuGrid();
  saveSudokuState(); // 힌트 사용 후 자동저장
  checkSudokuWin();
}

/** 스도쿠 정답 완료 여부 체크 */
function checkSudokuWin() {
  if (!isSudokuComplete(sudokuState.user)) return;
  if (!boardsEqual(sudokuState.user, sudokuState.solution)) return;
  showSudokuResult();
}

/** 스도쿠 게임 시작 (퍼즐 생성 및 상태 초기화) */
function startSudokuGame(difficultyKey) {
  stopSudokuTimer();
  sudokuMessageEl.textContent = t("sudoku.generating");

  setTimeout(() => {
    const { puzzle, solution } = generateSudokuPuzzle(difficultyKey);
    const maxHearts = getSudokuMaxHearts(difficultyKey);
    sudokuState = {
      puzzle,
      solution,
      user: [...puzzle],
      fixed: puzzle.map((v) => v !== 0),
      notes: createEmptyNotes(),
      hinted: Array(SUDOKU_CELLS).fill(false),
      selectedCell: null,
      memoMode: false,
      difficultyKey,
      elapsedSeconds: 0,
      hintsUsed: 0,
      maxHearts,
      hearts: maxHearts,
      invincible: sudokuInvincibleMode,
    };

    initSudokuNumpad();
    updateSudokuMemoButton();
    updateSudokuInvincibleButtons();
    updateSudokuHeartsDisplay();
    startSudokuTimer();
    setSudokuMessage("");
    renderSudokuGrid();
    showScreen("sudokuPlay");
  }, 10);
}

/** 스도쿠 승리 결과 화면 표시 */
function showSudokuResult() {
  stopSudokuTimer();
  clearSudokuSave(); // 완료 시 세이브 삭제
  lastResultGameId = "sudoku";
  lastResultWon = true;

  resultTitle.textContent = t("result.correct");
  resultMessage.textContent = t("sudoku.winMessage");
  const details = [
    t("sudoku.result.detail", {
      difficulty: t(`difficulty.${sudokuState.difficultyKey}`),
      hints: sudokuState.hintsUsed,
    }),
    t("sudoku.result.time", { n: sudokuState.elapsedSeconds }),
  ];
  const recordResult = tryUpdateRecord({
    gameId: "sudoku",
    difficultyKey: sudokuState.difficultyKey,
    digits: null,
    value: sudokuState.elapsedSeconds,
    metric: "time",
  });
  resultDetail.textContent = appendRecordToResult(details, recordResult).join(" · ");

  showScreen("result");
}

/** 스도쿠 실패(하트 0) 화면 표시 */
function showSudokuFail() {
  stopSudokuTimer();
  clearSudokuSave(); // 실패 시 세이브 삭제
  lastResultGameId = "sudoku";
  lastResultWon = false;

  resultTitle.textContent = t("result.fail");
  resultMessage.textContent = t("sudoku.failMessage");
  resultDetail.textContent = [
    t(`difficulty.${sudokuState.difficultyKey}`),
    t("sudoku.result.time", { n: sudokuState.elapsedSeconds }),
  ].join(" · ");

  showScreen("result");
}

/** 숫자야구 중복 허용 버튼 UI 업데이트 */
function updateBaseballDuplicateButton() {
  const label = baseballDuplicateMode ? t("baseball.duplicateOn") : t("baseball.duplicate");
  btnBaseballDuplicateSelect.textContent = label;
  btnBaseballDuplicatePlay.textContent = label;
  btnBaseballDuplicateSelect.classList.toggle("active", baseballDuplicateMode);
  btnBaseballDuplicatePlay.classList.toggle("active", baseballDuplicateMode);
}

/** 숫자야구 중복 허용 모드 토글 */
function toggleBaseballDuplicateMode() {
  baseballDuplicateMode = !baseballDuplicateMode;
  if (baseballState.answer) {
    baseballState.allowDuplicate = baseballDuplicateMode;
    baseballRuleDesc.textContent = getBaseballRuleDescText();
  }
  updateBaseballDuplicateButton();
}

/** 숫자야구 규칙 설명 텍스트 반환 */
function getBaseballRuleDescText() {
  const dup = baseballDuplicateMode
    ? t("baseball.duplicateRuleOn")
    : t("baseball.duplicateRuleOff");
  if (baseballState.digits && baseballState.minVal) {
    return `${t("baseball.rule", {
      n: baseballState.digits,
      min: formatNumber(baseballState.minVal),
      max: formatNumber(baseballState.maxVal),
    })} · ${dup}`;
  }
  return dup;
}

/** 숫자야구 자릿수 선택 화면 렌더링 */
function renderBaseballDigitSelect() {
  updateBaseballDuplicateButton();
  baseballDigitOptionsEl.innerHTML = DIGIT_OPTIONS.map((opt, i) => {
    /** 자릿수 선택 버튼에서 우측 작은 글씨(범위, 기록) 제거 */
    return `
    <button type="button" class="option-btn" data-index="${i}">
      <span class="label">${t("digit.unit", { n: opt.digits })}</span>
    </button>
  `;
  }).join("");

  baseballDigitOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      startBaseballGame(DIGIT_OPTIONS[Number(btn.dataset.index)]);
    });
  });
}

/** 숫자야구 시도 횟수 표시 업데이트 */
function updateBaseballAttemptsDisplay() {
  const count = formatAttemptsUnit(baseballState.attempts);
  baseballAttemptsLabelEl.innerHTML = `${t("baseball.attempts")} <strong>${count}</strong>`;
}

/** 숫자야구 경과 시간 표시 업데이트 */
function updateBaseballStopwatchDisplay() {
  baseballStopwatchEl.textContent = t("baseball.timer", {
    n: baseballState.elapsedSeconds,
  });
}

/** 숫자야구 타이머 정지 */
function stopBaseballTimer() {
  if (baseballTimerId !== null) {
    clearInterval(baseballTimerId);
    baseballTimerId = null;
  }
}

/** 숫자야구 타이머 시작 */
function startBaseballTimer() {
  stopBaseballTimer();
  baseballState.elapsedSeconds = 0;
  updateBaseballStopwatchDisplay();
  baseballTimerId = setInterval(() => {
    baseballState.elapsedSeconds += 1;
    updateBaseballStopwatchDisplay();
  }, 1000);
}

/** 숫자야구 현재까지 획득한 힌트 목록 표시 */
function renderBaseballHintList() {
  baseballHintsEl.innerHTML = baseballState.digitHints
    .map((hint) => `<li>${formatDigitHint(hint)}</li>`)
    .join("");
}

/** 숫자야구 무작위 자릿수 힌트 요청 */
function requestBaseballHint() {
  const hintData = generateDigitHint(
    baseballState.answer,
    baseballState.digits,
    baseballState.hintKeys
  );

  if (!hintData) {
    baseballFeedbackEl.textContent = t("baseball.hint.none");
    baseballFeedbackEl.className = "feedback feedback--baseball error";
    return;
  }

  baseballState.hintKeys.add(hintData.key);
  baseballState.digitHints.push(hintData);
  renderBaseballHintList();
}

/** 숫자야구 게임 시작 (정답 생성 및 상태 초기화) */
function startBaseballGame(digitOpt) {
  stopBaseballTimer();

  baseballState = {
    answer: generateBaseballAnswerWithMode(
      digitOpt.minVal,
      digitOpt.maxVal,
      digitOpt.digits,
      baseballDuplicateMode
    ),
    attempts: 0,
    minVal: digitOpt.minVal,
    maxVal: digitOpt.maxVal,
    digits: digitOpt.digits,
    allowDuplicate: baseballDuplicateMode,
    elapsedSeconds: 0,
    hintKeys: new Set(),
    digitHints: [],
  };

  baseballRangeBadge.textContent = getDigitLabel(digitOpt.digits);
  baseballRuleDesc.textContent = getBaseballRuleDescText();
  updateBaseballDuplicateButton();
  baseballInput.placeholder = t("baseball.placeholder", { n: digitOpt.digits });
  baseballInput.maxLength = digitOpt.digits;
  updateBaseballAttemptsDisplay();
  startBaseballTimer();

  baseballFeedbackEl.textContent = "";
  baseballFeedbackEl.className = "feedback feedback--baseball";
  baseballHistoryEl.innerHTML = "";
  baseballHintsEl.innerHTML = "";
  baseballInput.value = "";

  showScreen("baseballPlay");
  baseballInput.focus();
}

/** 숫자야구 기록(History) 리스트에 항목 추가 */
function addBaseballHistory(guess, strikes, balls, outs) {
  const li = document.createElement("li");
  const hint = formatBaseballHint(strikes, balls, outs);
  li.innerHTML = `<span>${padNumber(guess, baseballState.digits)}</span><span class="hint">${hint}</span>`;
  baseballHistoryEl.prepend(li);
}

/** 숫자야구 승리 결과 화면 표시 */
function showBaseballResult() {
  stopBaseballTimer();
  lastResultGameId = "baseball";
  lastResultWon = true;
  baseballHistoryEl.innerHTML = "";

  resultTitle.textContent = t("result.correct");
  resultMessage.textContent = t("baseball.winMessage", { n: baseballState.attempts });
  const details = [
    t("baseball.result.detail", {
      digits: getDigitLabel(baseballState.digits),
      answer: padNumber(baseballState.answer, baseballState.digits),
    }),
    t("baseball.result.time", { n: baseballState.elapsedSeconds }),
  ];
  const recordResult = tryUpdateRecord({
    gameId: "baseball",
    difficultyKey: "none",
    digits: baseballState.digits,
    value: baseballState.elapsedSeconds,
    metric: "time",
  });
  resultDetail.textContent = appendRecordToResult(details, recordResult).join(" · ");

  showScreen("result");
}

/** 횟수맞추기 자릿수 선택 화면 렌더링 */
function renderDigitSelect() {
  digitOptionsEl.innerHTML = DIGIT_OPTIONS.map((opt, i) => `
    <button type="button" class="option-btn" data-index="${i}">
      <span class="label">${t("digit.unit", { n: opt.digits })}</span>
    </button>
  `).join("");

  digitOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDigit = DIGIT_OPTIONS[Number(btn.dataset.index)];
      showDifficultySelect();
    });
  });
}

/** 횟수맞추기 난이도 선택 화면 렌더링 */
function showDifficultySelect() {
  const { digits, minVal, maxVal } = selectedDigit;
  /** 자릿수 중복 표기를 방지하기 위해 상단 헤더에 '범위'만 표시 */
  difficultyDigitInfo.textContent = `${formatNumber(minVal)} ~ ${formatNumber(maxVal)}`;

  difficultyOptionsEl.innerHTML = getAvailableDifficulties(digits).map((diff) => {
    const recordLine = getRecordMetaLine("guess", diff.key, digits);
    return `
    <button type="button" class="option-btn" data-difficulty="${diff.key}">
      <span class="label">${getDifficultyName(diff.key)}</span>
      <span class="meta-wrap">
        <span class="meta">${getDifficultyMeta(digits, diff.key)}</span>
        <span class="record-meta">${recordLine}</span>
      </span>
    </button>
  `;
  }).join("");

  difficultyOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      startGame(selectedDigit, btn.dataset.difficulty);
    });
  });

  showScreen("difficulty");
}

/** 횟수맞추기 게임 시작 (정답 생성 및 상태 초기화) */
function startGame(digitOpt, difficultyKey) {
  const maxAttempts = getMaxAttempts(digitOpt.digits, difficultyKey);
  const unlimited = difficultyKey === "unlimited";

  gameState = {
    answer: randomInt(digitOpt.minVal, digitOpt.maxVal),
    attempts: 0,
    maxAttempts,
    unlimited,
    minVal: digitOpt.minVal,
    maxVal: digitOpt.maxVal,
    digits: digitOpt.digits,
    difficultyKey,
  };

  rangeBadge.textContent = getDigitLabel(digitOpt.digits);
  difficultyBadge.textContent = getDifficultyBadgeText(
    difficultyKey,
    maxAttempts,
    unlimited
  );
  updateAttemptsDisplay();

  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  historyEl.innerHTML = "";
  guessInput.min = digitOpt.minVal;
  guessInput.max = digitOpt.maxVal;
  guessInput.value = "";

  showScreen("play");
  guessInput.focus();
}

/** 결과 화면에 표시할 시도 제한 텍스트 반환 */
function getResultLimitText() {
  if (gameState.unlimited) return t("result.limitUnlimited");
  return t("result.limitAttempts", { n: gameState.maxAttempts });
}

/** 횟수맞추기 게임 결과 화면 표시 */
function showGuessResult(won) {
  lastResultGameId = "guess";
  lastResultWon = won;
  historyEl.innerHTML = "";

  const digitsLabel = getDigitLabel(gameState.digits);
  const difficultyName = getDifficultyName(gameState.difficultyKey);

  if (won) {
    resultTitle.textContent = t("result.correct");
    resultMessage.textContent = t("result.winMessage", { n: gameState.attempts });
    const details = [
      t("result.detail.win", {
        digits: digitsLabel,
        difficulty: difficultyName,
        limit: getResultLimitText(),
      }),
    ];
    const recordResult = tryUpdateRecord({
      gameId: "guess",
      difficultyKey: gameState.difficultyKey,
      digits: gameState.digits,
      value: gameState.attempts,
      metric: "attempts",
    });
    resultDetail.textContent = appendRecordToResult(details, recordResult).join(" · ");
  } else {
    resultTitle.textContent = t("result.fail");
    resultMessage.textContent = t("result.failMessage", { n: gameState.maxAttempts });
    resultDetail.textContent = t("result.detail.fail", {
      answer: formatNumber(gameState.answer),
      digits: digitsLabel,
      difficulty: difficultyName,
    });
  }

  showScreen("result");
}

/** 횟수맞추기 기록(History) 리스트에 항목 추가 */
function addHistory(guess, hint) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${formatNumber(guess)}</span><span class="hint">${hint}</span>`;
  historyEl.prepend(li);
}

/** 현재 보고 있는 화면의 UI 요소 및 다국어 텍스트 새로고침 */
function refreshCurrentScreen() {
  const screen = getActiveScreenName();

  applyStaticTranslations();
  setHeader(currentHeaderMode);

  if (screen === "home") renderHome();
  if (screen === "select") renderDigitSelect();
  if (screen === "difficulty" && selectedDigit) showDifficultySelect();
  if (screen === "play" && gameState.answer) {
    rangeBadge.textContent = getDigitLabel(gameState.digits);
    difficultyBadge.textContent = getDifficultyBadgeText(
      gameState.difficultyKey,
      gameState.maxAttempts,
      gameState.unlimited
    );
    updateAttemptsDisplay();
  }
  if (screen === "baseballSelect") renderBaseballDigitSelect();
  if (screen === "baseballPlay" && baseballState.answer) {
    baseballRangeBadge.textContent = getDigitLabel(baseballState.digits);
    baseballRuleDesc.textContent = getBaseballRuleDescText();
    baseballInput.placeholder = t("baseball.placeholder", { n: baseballState.digits });
    updateBaseballAttemptsDisplay();
    updateBaseballStopwatchDisplay();
    updateBaseballDuplicateButton();
    renderBaseballHintList();
  }
  if (screen === "sudokuSelect") {
    renderSudokuDifficultySelect();
    updateSudokuInvincibleButtons();
  }
  if (screen === "sudokuPlay" && sudokuState.solution.length) {
    updateSudokuStopwatchDisplay();
    updateSudokuMemoButton();
    updateSudokuInvincibleButtons();
    updateSudokuHeartsDisplay();
    renderSudokuGrid();
  }
  if (screen === "blockblastSelect") {
    renderBlockblastDifficultySelect();
  }
  if (screen === "blockblastPlay") {
    updateBlockblastScoreDisplay();
    renderBlockblastBoard();
    renderBlockblastPieces();
  }
  if (screen === "brickbreakerSelect") {
    renderBrickbreakerDifficultySelect();
  }
  if (screen === "result" && lastResultWon !== null) {
    if (lastResultGameId === "baseball") showBaseballResult();
    else if (lastResultGameId === "sudoku") {
      if (lastResultWon) showSudokuResult();
      else showSudokuFail();
    } else if (lastResultGameId !== "blockblast" && lastResultGameId !== "brickbreaker") {
      showGuessResult(lastResultWon);
    }
  }
}

/** 언어 변경 처리 */
function changeLanguage(lang) {
  setLanguage(lang);
  refreshCurrentScreen();
  if (typeof refreshLeaderboardTranslations === "function") {
    refreshLeaderboardTranslations();
  }
}

// 횟수맞추기 정답 제출 이벤트 처리
guessForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const raw = guessInput.value.trim();
  if (raw === "") {
    feedbackEl.textContent = t("error.empty");
    feedbackEl.className = "feedback error";
    return;
  }

  const guess = Number(raw);
  if (!Number.isInteger(guess)) {
    feedbackEl.textContent = t("error.invalid");
    feedbackEl.className = "feedback error";
    return;
  }

  const { minVal, maxVal, answer, maxAttempts, unlimited } = gameState;
  if (guess < minVal || guess > maxVal) {
    feedbackEl.textContent = t("error.range", {
      min: formatNumber(minVal),
      max: formatNumber(maxVal),
    });
    feedbackEl.className = "feedback error";
    return;
  }

  gameState.attempts += 1;
  updateAttemptsDisplay();

  if (guess < answer) {
    feedbackEl.textContent = "Up";
    feedbackEl.className = "feedback";
    addHistory(guess, "Up");
  } else if (guess > answer) {
    feedbackEl.textContent = "Down";
    feedbackEl.className = "feedback";
    addHistory(guess, "Down");
  } else {
    showGuessResult(true);
    return;
  }

  if (!unlimited && gameState.attempts >= maxAttempts) {
    showGuessResult(false);
    return;
  }

  guessInput.value = "";
  guessInput.focus();
});

// 결과 화면 - 다시 하기(Replay) 버튼 처리
btnReplay.addEventListener("click", () => {
  if (lastResultGameId === "baseball") {
    startBaseballGame({
      digits: baseballState.digits,
      minVal: baseballState.minVal,
      maxVal: baseballState.maxVal,
    });
    return;
  }
  if (lastResultGameId === "sudoku") {
    startSudokuGame(sudokuState.difficultyKey);
    return;
  }
  if (lastResultGameId === "blockblast") {
    startBlockblastGame(blockblastState.difficultyKey);
    return;
  }
  if (lastResultGameId === "brickbreaker") {
    startBrickbreakerGame(bbState?.difficultyKey || "normal");
    return;
  }
  startGame(
    { digits: gameState.digits, minVal: gameState.minVal, maxVal: gameState.maxVal },
    gameState.difficultyKey
  );
});

// 결과 화면 - 처음부터(자릿수/난이도 변경) 버튼 처리
btnChangeDigit.addEventListener("click", () => {
  if (lastResultGameId === "baseball") {
    showScreen("baseballSelect");
    renderBaseballDigitSelect();
    return;
  }
  if (lastResultGameId === "sudoku") {
    showScreen("sudokuSelect");
    renderSudokuDifficultySelect();
    return;
  }
  if (lastResultGameId === "brickbreaker") {
    showScreen("brickbreakerSelect");
    renderBrickbreakerDifficultySelect();
    return;
  }
  if (lastResultGameId === "blockblast") {
    showScreen("blockblastSelect");
    renderBlockblastDifficultySelect();
    return;
  }
  selectedDigit = null;
  showScreen("select");
  renderDigitSelect();
});

// 숫자야구 정답 제출 이벤트 처리
baseballForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const raw = baseballInput.value;
  if (raw.trim() === "") {
    baseballFeedbackEl.textContent = t("error.empty");
    baseballFeedbackEl.className = "feedback feedback--baseball error";
    return;
  }

  const allowDup = baseballState.allowDuplicate ?? baseballDuplicateMode;
  const validation = checkBaseballGuessWithMode(
    raw,
    baseballState.digits,
    baseballState.minVal,
    baseballState.maxVal,
    allowDup
  );

  if (!validation.valid) {
    if (validation.reason === "length") {
      baseballFeedbackEl.textContent = t("baseball.error.digitLength", {
        n: baseballState.digits,
      });
    } else if (validation.reason === "duplicate") {
      baseballFeedbackEl.textContent = t("baseball.error.duplicate", {
        n: baseballState.digits,
      });
    } else if (validation.reason === "range") {
      baseballFeedbackEl.textContent = t("error.range", {
        min: formatNumber(baseballState.minVal),
        max: formatNumber(baseballState.maxVal),
      });
    } else {
      baseballFeedbackEl.textContent = t("error.invalid");
    }
    baseballFeedbackEl.className = "feedback feedback--baseball error";
    return;
  }

  baseballState.attempts += 1;
  updateBaseballAttemptsDisplay();

  const { strikes, balls, outs } = calculateStrikeBall(
    baseballState.answer,
    validation.value,
    baseballState.digits
  );

  baseballFeedbackEl.textContent = formatBaseballHint(strikes, balls, outs);
  baseballFeedbackEl.className = "feedback feedback--baseball";
  addBaseballHistory(validation.value, strikes, balls, outs);

  if (strikes === baseballState.digits) {
    showBaseballResult();
    return;
  }

  baseballInput.value = "";
  baseballInput.focus();
});

// 숫자야구/스도쿠 기타 컨트롤 버튼 리스너 등록
btnBaseballHint.addEventListener("click", requestBaseballHint);
btnBaseballDuplicateSelect.addEventListener("click", toggleBaseballDuplicateMode);
btnBaseballDuplicatePlay.addEventListener("click", toggleBaseballDuplicateMode);
btnBaseballBackHome.addEventListener("click", goHome);

btnSudokuMemo.addEventListener("click", toggleSudokuMemoMode);
btnSudokuHint.addEventListener("click", requestSudokuHint);
btnSudokuErase.addEventListener("click", eraseSudokuCell);
btnSudokuInvincible.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuInvincibleSelect.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuBackHome.addEventListener("click", goHome);
btnSudokuPlayBackHome.addEventListener("click", goHome);

btnBrickbreakerBackHome?.addEventListener("click", goHome);
btnBrickbreakerPlayBackHome?.addEventListener("click", goHome);
btnBBPause?.addEventListener("click", () => {
  if (typeof bbTogglePause === "function") bbTogglePause();
});

btnBackDigit.addEventListener("click", () => {
  showScreen("select");
  renderDigitSelect();
});

btnBackHomeFromDigit.addEventListener("click", goHome);
btnBackHomeFromResult.addEventListener("click", goHome);

// 언어 전환 버튼 리스너 등록
languageToggle.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => changeLanguage(btn.dataset.lang));
});

// 앱 초기화 로직 실행
document.documentElement.lang = getLanguage();
initAuth();
initProfile();
initHomeNav();
initLeaderboard();
applyStaticTranslations();
updateSudokuInvincibleButtons();
updateBaseballDuplicateButton();
renderHome();
goHome();
