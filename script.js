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
];

const SUDOKU_DIFFICULTIES = [
  { key: "easy", cluesKey: "sudoku.clues.easy" },
  { key: "normal", cluesKey: "sudoku.clues.normal" },
  { key: "hard", cluesKey: "sudoku.clues.hard" },
];

const SUDOKU_MAX_HEARTS = {
  easy: 5,
  normal: 5,
  hard: 3,
};

let sudokuInvincibleMode = false;

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

const screens = {
  home: document.getElementById("screen-home"),
  select: document.getElementById("screen-select"),
  difficulty: document.getElementById("screen-difficulty"),
  play: document.getElementById("screen-play"),
  baseballSelect: document.getElementById("screen-baseball-select"),
  baseballPlay: document.getElementById("screen-baseball-play"),
  sudokuSelect: document.getElementById("screen-sudoku-select"),
  sudokuPlay: document.getElementById("screen-sudoku-play"),
  result: document.getElementById("screen-result"),
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
}

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
  appEl.classList.toggle("app--sudoku", name === "sudokuPlay");
}

function goHome() {
  stopBaseballTimer();
  stopSudokuTimer();
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

function updateAttemptsDisplay() {
  if (gameState.unlimited) {
    const count = formatAttemptsUnit(gameState.attempts);
    attemptsLabelEl.innerHTML = `${t("play.attempts")} <strong>${count}</strong>`;
    return;
  }
  const remaining = gameState.maxAttempts - gameState.attempts;
  attemptsLabelEl.innerHTML = `${t("play.remaining")} <strong>${remaining}</strong>`;
}

function onAuthStateChanged() {
  if (isLoggedIn()) loadProfileForUser();
  else loadGuestProfile();
  renderAuthBar();
  refreshCurrentScreen();
}

function renderHome() {
  renderAuthBar();
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

  gameListEl.querySelectorAll("[data-game]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.game === "guess") goGuessGame();
      if (btn.dataset.game === "baseball") goBaseballGame();
      if (btn.dataset.game === "sudoku") goSudokuGame();
    });
  });
}

function setSudokuMessage(key) {
  sudokuMessageEl.textContent = key ? t(key) : "";
}

function stopSudokuTimer() {
  if (sudokuTimerId !== null) {
    clearInterval(sudokuTimerId);
    sudokuTimerId = null;
  }
}

function updateSudokuStopwatchDisplay() {
  sudokuStopwatchEl.textContent = t("sudoku.timer", { n: sudokuState.elapsedSeconds });
}

function startSudokuTimer() {
  stopSudokuTimer();
  sudokuState.elapsedSeconds = 0;
  updateSudokuStopwatchDisplay();
  sudokuTimerId = setInterval(() => {
    sudokuState.elapsedSeconds += 1;
    updateSudokuStopwatchDisplay();
  }, 1000);
}

function getSudokuMaxHearts(difficultyKey) {
  return SUDOKU_MAX_HEARTS[difficultyKey] || 5;
}

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

function toggleSudokuInvincibleMode() {
  sudokuInvincibleMode = !sudokuInvincibleMode;
  updateSudokuInvincibleButtons();
}

function updateSudokuHeartsDisplay() {
  sudokuHeartsEl.innerHTML = Array.from({ length: sudokuState.maxHearts }, (_, i) => {
    const filled = i < sudokuState.hearts;
    return `<span class="heart${filled ? "" : " empty"}">♥</span>`;
  }).join("");
}

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

function renderSudokuDifficultySelect() {
  updateSudokuInvincibleButtons();
  sudokuDifficultyOptionsEl.innerHTML = SUDOKU_DIFFICULTIES.map((diff) => {
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

  sudokuDifficultyOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => startSudokuGame(btn.dataset.difficulty));
  });
}

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

function renderSudokuGrid() {
  const conflicts = getAllConflicts(sudokuState.user);

  sudokuGridEl.innerHTML = Array.from({ length: SUDOKU_CELLS }, (_, idx) => {
    const fixed = sudokuState.fixed[idx];
    const value = sudokuState.user[idx];
    const notes = sudokuState.notes[idx];
    const showNotes = !value && notes.size > 0;
    const noteSpans = formatNotesDisplay(notes)
      .map((n) => `<span>${n}</span>`)
      .join("");

    const classes = ["sudoku-cell"];
    if (fixed) classes.push("fixed");
    if (sudokuState.selectedCell === idx) classes.push("selected");
    if (conflicts.has(idx)) classes.push("conflict");
    if (value && value !== sudokuState.solution[idx]) classes.push("wrong-answer");
    if (sudokuState.hinted[idx]) classes.push("hinted");
    if (showNotes) classes.push("show-notes");

    return `
      <button type="button" class="${classes.join(" ")}" data-idx="${idx}" ${fixed ? "disabled" : ""}>
        <span class="sudoku-value">${value || ""}</span>
        <div class="sudoku-notes">${noteSpans}</div>
      </button>
    `;
  }).join("");

  sudokuGridEl.querySelectorAll(".sudoku-cell:not(.fixed)").forEach((btn) => {
    btn.addEventListener("click", () => selectSudokuCell(Number(btn.dataset.idx)));
  });
}

function selectSudokuCell(idx) {
  if (sudokuState.fixed[idx]) {
    setSudokuMessage("sudoku.fixedCell");
    return;
  }
  sudokuState.selectedCell = idx;
  setSudokuMessage("");
  renderSudokuGrid();
}

function updateSudokuMemoButton() {
  btnSudokuMemo.textContent = sudokuState.memoMode ? t("sudoku.memoOn") : t("sudoku.memo");
  btnSudokuMemo.classList.toggle("active", sudokuState.memoMode);
}

function toggleSudokuMemoMode() {
  sudokuState.memoMode = !sudokuState.memoMode;
  updateSudokuMemoButton();
}

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

  checkSudokuWin();
}

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
}

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
  checkSudokuWin();
}

function checkSudokuWin() {
  if (!isSudokuComplete(sudokuState.user)) return;
  if (!boardsEqual(sudokuState.user, sudokuState.solution)) return;
  showSudokuResult();
}

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

function showSudokuResult() {
  stopSudokuTimer();
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

function showSudokuFail() {
  stopSudokuTimer();
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

function renderBaseballDigitSelect() {
  baseballDigitOptionsEl.innerHTML = DIGIT_OPTIONS.map((opt, i) => {
    const recordLine = getRecordMetaLine("baseball", "none", opt.digits);
    return `
    <button type="button" class="option-btn" data-index="${i}">
      <span class="label">${getDigitLabel(opt.digits)}</span>
      <span class="meta-wrap">
        <span class="meta">${formatNumber(opt.minVal)} ~ ${formatNumber(opt.maxVal)}</span>
        <span class="record-meta">${recordLine}</span>
      </span>
    </button>
  `;
  }).join("");

  baseballDigitOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      startBaseballGame(DIGIT_OPTIONS[Number(btn.dataset.index)]);
    });
  });
}

function updateBaseballAttemptsDisplay() {
  const count = formatAttemptsUnit(baseballState.attempts);
  baseballAttemptsLabelEl.innerHTML = `${t("baseball.attempts")} <strong>${count}</strong>`;
}

function updateBaseballStopwatchDisplay() {
  baseballStopwatchEl.textContent = t("baseball.timer", {
    n: baseballState.elapsedSeconds,
  });
}

function stopBaseballTimer() {
  if (baseballTimerId !== null) {
    clearInterval(baseballTimerId);
    baseballTimerId = null;
  }
}

function startBaseballTimer() {
  stopBaseballTimer();
  baseballState.elapsedSeconds = 0;
  updateBaseballStopwatchDisplay();
  baseballTimerId = setInterval(() => {
    baseballState.elapsedSeconds += 1;
    updateBaseballStopwatchDisplay();
  }, 1000);
}

function renderBaseballHintList() {
  baseballHintsEl.innerHTML = baseballState.digitHints
    .map((hint) => `<li>${formatDigitHint(hint)}</li>`)
    .join("");
}

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

function startBaseballGame(digitOpt) {
  stopBaseballTimer();

  baseballState = {
    answer: randomInt(digitOpt.minVal, digitOpt.maxVal),
    attempts: 0,
    minVal: digitOpt.minVal,
    maxVal: digitOpt.maxVal,
    digits: digitOpt.digits,
    elapsedSeconds: 0,
    hintKeys: new Set(),
    digitHints: [],
  };

  baseballRangeBadge.textContent = getDigitLabel(digitOpt.digits);
  baseballRuleDesc.textContent = t("baseball.rule", {
    n: digitOpt.digits,
    min: formatNumber(digitOpt.minVal),
    max: formatNumber(digitOpt.maxVal),
  });
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

function addBaseballHistory(guess, strikes, balls, outs) {
  const li = document.createElement("li");
  const hint = formatBaseballHint(strikes, balls, outs);
  li.innerHTML = `<span>${padNumber(guess, baseballState.digits)}</span><span class="hint">${hint}</span>`;
  baseballHistoryEl.prepend(li);
}

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

function renderDigitSelect() {
  digitOptionsEl.innerHTML = DIGIT_OPTIONS.map((opt, i) => `
    <button type="button" class="option-btn" data-index="${i}">
      <span class="label">${getDigitLabel(opt.digits)}</span>
      <span class="meta">${formatNumber(opt.minVal)} ~ ${formatNumber(opt.maxVal)}</span>
    </button>
  `).join("");

  digitOptionsEl.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDigit = DIGIT_OPTIONS[Number(btn.dataset.index)];
      showDifficultySelect();
    });
  });
}

function showDifficultySelect() {
  const { digits, minVal, maxVal } = selectedDigit;
  difficultyDigitInfo.textContent =
    `${getDigitLabel(digits)} · ${formatNumber(minVal)} ~ ${formatNumber(maxVal)}`;

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

function getResultLimitText() {
  if (gameState.unlimited) return t("result.limitUnlimited");
  return t("result.limitAttempts", { n: gameState.maxAttempts });
}

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

function addHistory(guess, hint) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${formatNumber(guess)}</span><span class="hint">${hint}</span>`;
  historyEl.prepend(li);
}

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
    baseballRuleDesc.textContent = t("baseball.rule", {
      n: baseballState.digits,
      min: formatNumber(baseballState.minVal),
      max: formatNumber(baseballState.maxVal),
    });
    baseballInput.placeholder = t("baseball.placeholder", { n: baseballState.digits });
    updateBaseballAttemptsDisplay();
    updateBaseballStopwatchDisplay();
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
  if (screen === "result" && lastResultWon !== null) {
    if (lastResultGameId === "baseball") showBaseballResult();
    else if (lastResultGameId === "sudoku") {
      if (lastResultWon) showSudokuResult();
      else showSudokuFail();
    } else showGuessResult(lastResultWon);
  }
}

function changeLanguage(lang) {
  setLanguage(lang);
  refreshCurrentScreen();
}

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
  startGame(
    { digits: gameState.digits, minVal: gameState.minVal, maxVal: gameState.maxVal },
    gameState.difficultyKey
  );
});

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
  selectedDigit = null;
  showScreen("select");
  renderDigitSelect();
});

baseballForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const raw = baseballInput.value;
  if (raw.trim() === "") {
    baseballFeedbackEl.textContent = t("error.empty");
    baseballFeedbackEl.className = "feedback feedback--baseball error";
    return;
  }

  const validation = isValidBaseballGuess(
    raw,
    baseballState.digits,
    baseballState.minVal,
    baseballState.maxVal
  );

  if (!validation.valid) {
    if (validation.reason === "length") {
      baseballFeedbackEl.textContent = t("baseball.error.digitLength", {
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

btnBaseballHint.addEventListener("click", requestBaseballHint);
btnBaseballBackHome.addEventListener("click", goHome);

btnSudokuMemo.addEventListener("click", toggleSudokuMemoMode);
btnSudokuHint.addEventListener("click", requestSudokuHint);
btnSudokuErase.addEventListener("click", eraseSudokuCell);
btnSudokuInvincible.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuInvincibleSelect.addEventListener("click", toggleSudokuInvincibleMode);
btnSudokuBackHome.addEventListener("click", goHome);
btnSudokuPlayBackHome.addEventListener("click", goHome);

btnBackDigit.addEventListener("click", () => {
  showScreen("select");
  renderDigitSelect();
});

btnBackHomeFromDigit.addEventListener("click", goHome);
btnBackHomeFromResult.addEventListener("click", goHome);

languageToggle.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => changeLanguage(btn.dataset.lang));
});

document.documentElement.lang = getLanguage();
initAuth();
initProfile();
applyStaticTranslations();
updateSudokuInvincibleButtons();
renderHome();
goHome();
