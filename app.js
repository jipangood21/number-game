/* ════════════════════════════════════════════
   숫자게임 — App
   constants · state · DOM refs · navigation
   event listeners · initialization
   ════════════════════════════════════════════ */

// ── Constants ─────────────────────────────────
const GAMES = [
  { id: "guess",        nameKey: "game.guess.name",        descriptionKey: "game.guess.description",        available: true },
  { id: "baseball",     nameKey: "game.baseball.name",     descriptionKey: "game.baseball.description",     available: true },
  { id: "sudoku",       nameKey: "game.sudoku.name",       descriptionKey: "game.sudoku.description",       available: true },
  { id: "blockblast",   nameKey: "game.blockblast.name",   descriptionKey: "game.blockblast.description",   available: true },
  { id: "brickbreaker", nameKey: "game.brickbreaker.name", descriptionKey: "game.brickbreaker.description", available: true },
];

const SUDOKU_DIFFICULTIES = [
  { key: "easy",   cluesKey: "sudoku.clues.easy"   },
  { key: "normal", cluesKey: "sudoku.clues.normal" },
  { key: "hard",   cluesKey: "sudoku.clues.hard"   },
];

const BLOCKBLAST_DIFFICULTIES = [
  { key: "easy",   nameKey: "blockblast.difficulty.easy"   },
  { key: "normal", nameKey: "blockblast.difficulty.normal" },
  { key: "hard",   nameKey: "blockblast.difficulty.hard"   },
];

const SUDOKU_MAX_HEARTS = { easy: 5, normal: 5, hard: 3 };

const DIGIT_OPTIONS = [
  { digits: 2, minVal: 1, maxVal: 100     },
  { digits: 3, minVal: 1, maxVal: 1000    },
  { digits: 4, minVal: 1, maxVal: 10000   },
  { digits: 5, minVal: 1, maxVal: 100000  },
  { digits: 6, minVal: 1, maxVal: 1000000 },
];

const DIFFICULTY_KEYS = [
  { key: "easy"     },
  { key: "normal"   },
  { key: "hard"     },
  { key: "oneshot", minDigits: 3 },
  { key: "unlimited" },
];

const ATTEMPT_LIMITS = {
  2: { easy: 7,  normal: 5,  hard: 3                              },
  3: { easy: 10, normal: 8,  hard: 5,  oneshot: 1                 },
  4: { easy: 20, normal: 15, hard: 10, oneshot: 1                 },
  5: { easy: 25, normal: 20, hard: 15, oneshot: 1                 },
  6: { easy: 30, normal: 25, hard: 20, oneshot: 1                 },
};

const HOME_NAV_SCREENS = new Set([
  "select", "difficulty", "play",
  "baseballSelect", "baseballPlay",
  "sudokuSelect", "sudokuPlay",
  "blockblastSelect", "blockblastPlay",
  "brickbreakerSelect", "brickbreakerPlay",
  "result",
]);

// ── Shared mutable state ──────────────────────
let currentHeaderMode = "home";
let currentGameId     = null;
let selectedDigit     = null;
let lastResultWon     = null;
let lastResultGameId  = null;

let sudokuInvincibleMode  = false;
let baseballDuplicateMode = false;

let gameState = {
  answer: 0, attempts: 0, maxAttempts: null, unlimited: false,
  minVal: 1, maxVal: 100, digits: 2, difficultyKey: "easy",
};

let baseballState = {
  answer: 0, attempts: 0, minVal: 1, maxVal: 100, digits: 3,
  elapsedSeconds: 0, hintKeys: new Set(), digitHints: [],
};

let sudokuState = {
  puzzle: [], solution: [], user: [], fixed: [], notes: [], hinted: [],
  selectedCell: null, memoMode: false, difficultyKey: "easy",
  elapsedSeconds: 0, hintsUsed: 0, maxHearts: 5, hearts: 5, invincible: false,
};

let blockblastState = {
  board: [], score: 0, bestScore: 0, combo: 0,
  difficultyKey: "easy", pieces: [], gameOver: false,
};

// ── DOM references ─────────────────────────────
const screens = {
  home:             document.getElementById("screen-home"),
  select:           document.getElementById("screen-select"),
  difficulty:       document.getElementById("screen-difficulty"),
  play:             document.getElementById("screen-play"),
  baseballSelect:   document.getElementById("screen-baseball-select"),
  baseballPlay:     document.getElementById("screen-baseball-play"),
  sudokuSelect:     document.getElementById("screen-sudoku-select"),
  sudokuPlay:       document.getElementById("screen-sudoku-play"),
  blockblastSelect:    document.getElementById("screen-blockblast-select"),
  blockblastPlay:      document.getElementById("screen-blockblast-play"),
  brickbreakerSelect:  document.getElementById("screen-brickbreaker-select"),
  brickbreakerPlay:    document.getElementById("screen-brickbreaker-play"),
  result:              document.getElementById("screen-result"),
};

const appEl = document.querySelector(".app");

const headerTitle    = document.getElementById("header-title");
const headerSubtitle = document.getElementById("header-subtitle");
const languageToggle = document.getElementById("language-toggle");
const gameListEl     = document.getElementById("game-list");

// Guess game
const digitOptionsEl       = document.getElementById("digit-options");
const difficultyOptionsEl  = document.getElementById("difficulty-options");
const difficultyDigitInfo  = document.getElementById("difficulty-digit-info");
const rangeBadge           = document.getElementById("range-badge");
const difficultyBadge      = document.getElementById("difficulty-badge");
const attemptsLabelEl      = document.getElementById("attempts-label");
const guessForm            = document.getElementById("guess-form");
const guessInput           = document.getElementById("guess-input");
const feedbackEl           = document.getElementById("feedback");
const historyEl            = document.getElementById("history");
const resultTitle          = document.getElementById("result-title");
const resultMessage        = document.getElementById("result-message");
const resultDetail         = document.getElementById("result-detail");
const btnReplay            = document.getElementById("btn-replay");
const btnChangeDigit       = document.getElementById("btn-change-digit");
const btnBackDigit         = document.getElementById("btn-back-digit");
const btnBackHomeFromDigit = document.getElementById("btn-back-home-from-digit");
const btnBackHomeFromResult= document.getElementById("btn-back-home-from-result");

// Baseball
const baseballDigitOptionsEl  = document.getElementById("baseball-digit-options");
const baseballRangeBadge      = document.getElementById("baseball-range-badge");
const baseballAttemptsLabelEl = document.getElementById("baseball-attempts-label");
const baseballRuleDesc        = document.getElementById("baseball-rule-desc");
const baseballForm            = document.getElementById("baseball-form");
const baseballInput           = document.getElementById("baseball-input");
const baseballFeedbackEl      = document.getElementById("baseball-feedback");
const baseballHistoryEl       = document.getElementById("baseball-history");
const baseballStopwatchEl     = document.getElementById("baseball-stopwatch");
const btnBaseballHint         = document.getElementById("btn-baseball-hint");
const baseballHintsEl         = document.getElementById("baseball-hints");
const btnBaseballBackHome     = document.getElementById("btn-baseball-back-home");
const btnBaseballDuplicateSelect = document.getElementById("btn-baseball-duplicate-select");
const btnBaseballDuplicatePlay   = document.getElementById("btn-baseball-duplicate-play");

// Sudoku
const sudokuDifficultyOptionsEl = document.getElementById("sudoku-difficulty-options");
const sudokuGridEl              = document.getElementById("sudoku-grid");
const sudokuNumpadEl            = document.getElementById("sudoku-numpad");
const sudokuStopwatchEl         = document.getElementById("sudoku-stopwatch");
const sudokuMessageEl           = document.getElementById("sudoku-message");
const btnSudokuMemo             = document.getElementById("btn-sudoku-memo");
const btnSudokuHint             = document.getElementById("btn-sudoku-hint");
const btnSudokuErase            = document.getElementById("btn-sudoku-erase");
const btnSudokuBackHome         = document.getElementById("btn-sudoku-back-home");
const btnSudokuPlayBackHome     = document.getElementById("btn-sudoku-play-back-home");
const sudokuHeartsEl            = document.getElementById("sudoku-hearts");
const btnSudokuInvincible       = document.getElementById("btn-sudoku-invincible");
const btnSudokuInvincibleSelect = document.getElementById("btn-sudoku-invincible-select");

// Home logo nav
const btnHomeLogo = document.getElementById("btn-home-logo");

// Block Blast / Brick Breaker
const blockblastDifficultyOptionsEl = document.getElementById("blockblast-difficulty-options");
const blockblastBoardEl             = document.getElementById("blockblast-board");
const blockblastPiecesEl            = document.getElementById("blockblast-pieces");
const blockblastCurrentScoreEl      = document.getElementById("blockblast-current-score");
const blockblastBestScoreEl         = document.getElementById("blockblast-best-score");
const blockblastMessageEl           = document.getElementById("blockblast-message");
const blockblastDifficultyBadge     = document.getElementById("blockblast-difficulty-badge");
const btnBlockblastBackHome         = document.getElementById("btn-blockblast-back-home");
const btnBlockblastPlayBackHome     = document.getElementById("btn-blockblast-play-back-home");
const btnBrickbreakerBackHome       = document.getElementById("btn-brickbreaker-back-home");
const btnBrickbreakerPlayBackHome   = document.getElementById("btn-brickbreaker-play-back-home");
const btnBBPause                    = document.getElementById("btn-bb-pause");

// ── Home nav ───────────────────────────────────
function updateHomeNavVisibility(screenName) {
  if (!btnHomeLogo) return;
  btnHomeLogo.classList.toggle("visible", HOME_NAV_SCREENS.has(screenName));
}

function initHomeNav() {
  if (!btnHomeLogo) return;
  btnHomeLogo.addEventListener("click", () => goHome());
  updateHomeNavVisibility("home");
}

function refreshHomeNavLabel() {
  if (!btnHomeLogo) return;
  btnHomeLogo.textContent = t("nav.homeLogo");
  btnHomeLogo.setAttribute("aria-label", t("nav.homeAria"));
}

// ── Shared utilities ───────────────────────────
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

function getDigitLabel(digits) {
  const opt = DIGIT_OPTIONS.find((d) => d.digits === digits);
  if (opt) return `${formatNumber(opt.minVal)} ~ ${formatNumber(opt.maxVal)}`;
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
  if (unlimited)         return t("difficulty.badge.unlimited", { name });
  if (maxAttempts === 1) return t("difficulty.badge.one", { name });
  return t("difficulty.badge.attempts", { name, n: maxAttempts });
}

// ── Core navigation ────────────────────────────
function getActiveScreenName() {
  return Object.entries(screens).find(([, el]) => el.classList.contains("active"))?.[0];
}

function setHeader(mode) {
  currentHeaderMode = mode;
  headerTitle.textContent    = t(`${mode}.title`);
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

  if (typeof refreshProfileTranslations === "function") refreshProfileTranslations();
  if (typeof refreshAuthTranslations    === "function") refreshAuthTranslations();
  if (typeof refreshHomeNavLabel        === "function") refreshHomeNavLabel();
  if (typeof updateVersionUI            === "function") updateVersionUI();
}

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
  appEl.classList.toggle("app--sudoku", name === "sudokuPlay");
  if (typeof updateHomeNavVisibility === "function") updateHomeNavVisibility(name);
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
      return `<div class="game-card game-card--disabled">
        <span class="label">${t(game.nameKey)}</span>
        <span class="meta">${t("game.comingSoon")}</span>
      </div>`;
    }
    return `<button type="button" class="game-card" data-game="${game.id}">
      <span class="label">${t(game.nameKey)}</span>
      <span class="meta">${t(game.descriptionKey)}</span>
    </button>`;
  }).join("");

  const gameHandlers = {
    guess:        goGuessGame,
    baseball:     goBaseballGame,
    sudoku:       goSudokuGame,
    blockblast:   goBlockblastGame,
    brickbreaker: goBrickbreakerGame,
  };

  gameListEl.querySelectorAll("[data-game]").forEach((btn) => {
    btn.addEventListener("click", () => gameHandlers[btn.dataset.game]?.());
  });
}

/** 현재 보고 있는 화면의 UI 요소 및 다국어 텍스트 새로고침 */
function refreshCurrentScreen() {
  const screen = getActiveScreenName();

  applyStaticTranslations();
  setHeader(currentHeaderMode);

  if (screen === "home")       renderHome();
  if (screen === "select")     renderDigitSelect();
  if (screen === "difficulty" && selectedDigit) showDifficultySelect();
  if (screen === "play" && gameState.answer) {
    rangeBadge.textContent = getDigitLabel(gameState.digits);
    difficultyBadge.textContent = getDifficultyBadgeText(
      gameState.difficultyKey, gameState.maxAttempts, gameState.unlimited
    );
    updateAttemptsDisplay();
  }
  if (screen === "baseballSelect") renderBaseballDigitSelect();
  if (screen === "baseballPlay" && baseballState.answer) {
    baseballRangeBadge.textContent = getDigitLabel(baseballState.digits);
    baseballRuleDesc.textContent   = getBaseballRuleDescText();
    baseballInput.placeholder      = t("baseball.placeholder", { n: baseballState.digits });
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
  if (screen === "blockblastSelect") renderBlockblastDifficultySelect();
  if (screen === "blockblastPlay") {
    updateBlockblastScoreDisplay();
    renderBlockblastBoard();
    renderBlockblastPieces();
  }
  if (screen === "brickbreakerSelect") renderBrickbreakerDifficultySelect();
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
  if (typeof refreshLeaderboardTranslations === "function") refreshLeaderboardTranslations();
}

// ── Event listeners ────────────────────────────

// 횟수맞추기 정답 제출
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
    feedbackEl.textContent = t("error.range", { min: formatNumber(minVal), max: formatNumber(maxVal) });
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

// 숫자야구 정답 제출
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
    raw, baseballState.digits, baseballState.minVal, baseballState.maxVal, allowDup
  );

  if (!validation.valid) {
    if (validation.reason === "length") {
      baseballFeedbackEl.textContent = t("baseball.error.digitLength", { n: baseballState.digits });
    } else if (validation.reason === "duplicate") {
      baseballFeedbackEl.textContent = t("baseball.error.duplicate", { n: baseballState.digits });
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
    baseballState.answer, validation.value, baseballState.digits
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

// 결과 화면 — 다시 하기
btnReplay.addEventListener("click", () => {
  if (lastResultGameId === "baseball") {
    startBaseballGame({ digits: baseballState.digits, minVal: baseballState.minVal, maxVal: baseballState.maxVal });
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
  startGame({ digits: gameState.digits, minVal: gameState.minVal, maxVal: gameState.maxVal }, gameState.difficultyKey);
});

// 결과 화면 — 처음부터(자릿수/난이도 변경)
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

// 숫자야구 컨트롤
btnBaseballHint.addEventListener("click", requestBaseballHint);
btnBaseballDuplicateSelect.addEventListener("click", toggleBaseballDuplicateMode);
btnBaseballDuplicatePlay.addEventListener("click", toggleBaseballDuplicateMode);
btnBaseballBackHome.addEventListener("click", goHome);

// 스도쿠 컨트롤
btnSudokuMemo.addEventListener("click", toggleSudokuMemoMode);
btnSudokuHint.addEventListener("click", requestSudokuHint);
btnSudokuErase.addEventListener("click", eraseSudokuCell);
btnSudokuInvincible.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuInvincibleSelect.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuBackHome.addEventListener("click", goHome);
btnSudokuPlayBackHome.addEventListener("click", goHome);

// 벽돌깨기 컨트롤
btnBrickbreakerBackHome?.addEventListener("click", goHome);
btnBrickbreakerPlayBackHome?.addEventListener("click", goHome);
btnBBPause?.addEventListener("click", () => {
  if (typeof bbTogglePause === "function") bbTogglePause();
});

// 횟수맞추기 공통 네비게이션
btnBackDigit.addEventListener("click", () => {
  showScreen("select");
  renderDigitSelect();
});
btnBackHomeFromDigit.addEventListener("click", goHome);
btnBackHomeFromResult.addEventListener("click", goHome);

// 언어 전환
languageToggle.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => changeLanguage(btn.dataset.lang));
});

// ── Initialization ─────────────────────────────
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
