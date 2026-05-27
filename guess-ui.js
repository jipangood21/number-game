/* ════════════════════════════════════════════
   횟수맞추기(Up/Down) UI
   ════════════════════════════════════════════ */

/** 횟수맞추기 시도 횟수 표시 업데이트 */
function updateAttemptsDisplay() {
  if (gameState.unlimited) {
    const count = formatAttemptsUnit(gameState.attempts);
    attemptsLabelEl.innerHTML = `${t("play.attempts")} <strong>${count}</strong>`;
    return;
  }
  const remaining = gameState.maxAttempts - gameState.attempts;
  attemptsLabelEl.innerHTML = `${t("play.remaining")} <strong>${remaining}</strong>`;
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
  difficultyBadge.textContent = getDifficultyBadgeText(difficultyKey, maxAttempts, unlimited);
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
