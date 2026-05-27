/* ════════════════════════════════════════════
   숫자야구 UI
   ════════════════════════════════════════════ */

let baseballTimerId = null;

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
  baseballDigitOptionsEl.innerHTML = DIGIT_OPTIONS.map((opt, i) => `
    <button type="button" class="option-btn" data-index="${i}">
      <span class="label">${t("digit.unit", { n: opt.digits })}</span>
    </button>
  `).join("");

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
  baseballStopwatchEl.textContent = t("baseball.timer", { n: baseballState.elapsedSeconds });
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
