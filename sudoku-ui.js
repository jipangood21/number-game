/* ════════════════════════════════════════════
   스도쿠 UI
   ════════════════════════════════════════════ */

let sudokuTimerId = null;
let sudokuCellEls = null;

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
 * 기존 DOM 재사용으로 전체 innerHTML 재생성 방지
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

    let cls = "sudoku-cell";
    if (sudokuState.fixed[idx])                                                                   cls += " fixed";
    if (sudokuState.selectedCell === idx)                                                          cls += " selected";
    if (value && selectedValue && value === selectedValue && idx !== sudokuState.selectedCell)     cls += " same-number";
    if (!value && selectedValue && notes.has(selectedValue) && idx !== sudokuState.selectedCell)  cls += " note-highlight";
    if (conflicts.has(idx))                                                                       cls += " conflict";
    if (value && value !== sudokuState.solution[idx])                                             cls += " wrong-answer";
    if (sudokuState.hinted[idx])                                                                  cls += " hinted";
    if (showNotes)                                                                                cls += " show-notes";
    btn.className = cls;

    btn.querySelector(".sudoku-value").textContent = value || "";

    const notesDiv = btn.querySelector(".sudoku-notes");
    if (showNotes) {
      notesDiv.innerHTML = formatNotesDisplay(notes).map((n, i) => {
        const num = i + 1;
        const hl = selectedValue && num === selectedValue && notes.has(num);
        return `<span${hl ? ' class="note-hl"' : ''}>${n}</span>`;
      }).join("");
    } else if (notesDiv.innerHTML !== "") {
      notesDiv.innerHTML = "";
    }
  }

  updateSudokuNumpad();
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

/** 키패드 상태 업데이트 (완성 숫자 비활성화 + 메모 하이라이트) */
function updateSudokuNumpad() {
  const completedNums = new Set();
  for (let n = 1; n <= 9; n++) {
    let count = 0;
    for (let i = 0; i < SUDOKU_CELLS; i++) {
      if (sudokuState.user[i] === n && sudokuState.solution[i] === n) count++;
    }
    if (count === 9) completedNums.add(n);
  }
  const selNotes = (sudokuState.memoMode && sudokuState.selectedCell !== null)
    ? sudokuState.notes[sudokuState.selectedCell]
    : null;
  sudokuNumpadEl.querySelectorAll(".sudoku-num-btn[data-num]").forEach((btn) => {
    const n = Number(btn.dataset.num);
    const done = completedNums.has(n);
    btn.disabled = done;
    btn.classList.toggle("memo-noted", !done && !!(selNotes && selNotes.has(n)));
  });
}

/** 스도쿠 메모 모드 토글 */
function toggleSudokuMemoMode() {
  sudokuState.memoMode = !sudokuState.memoMode;
  updateSudokuMemoButton();
  updateSudokuNumpad();
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
    if (sudokuCellEls) {
      const notes = sudokuState.notes[idx];
      const showNotes = notes.size > 0;
      sudokuCellEls[idx].classList.toggle("show-notes", showNotes);
      const notesDiv = sudokuCellEls[idx].querySelector(".sudoku-notes");
      if (showNotes) {
        notesDiv.innerHTML = formatNotesDisplay(notes).map(n => `<span>${n}</span>`).join("");
      } else {
        notesDiv.innerHTML = "";
      }
    }
    updateSudokuNumpad();
    saveSudokuState();
    return;
  }

  const isWrong = sudokuState.solution[idx] !== num;

  sudokuState.user[idx] = num;
  sudokuState.notes[idx].clear();
  sudokuState.hinted[idx] = false;

  // 정답일 때만 같은 행/열/박스의 메모에서 해당 숫자 제거
  if (!isWrong) {
    const r0 = Math.floor(idx / 9);
    const c0 = idx % 9;
    const br = Math.floor(r0 / 3);
    const bc = Math.floor(c0 / 3);
    for (let i = 0; i < SUDOKU_CELLS; i++) {
      if (i === idx || !sudokuState.notes[i].has(num)) continue;
      const r = Math.floor(i / 9);
      const c = i % 9;
      if (r === r0 || c === c0 || (Math.floor(r / 3) === br && Math.floor(c / 3) === bc)) {
        sudokuState.notes[i].delete(num);
      }
    }
  }

  renderSudokuGrid();

  if (isWrong) {
    handleSudokuWrongAnswer();
    if (sudokuState.hearts <= 0 && !sudokuState.invincible) return;
  } else {
    setSudokuMessage("");
  }

  saveSudokuState();
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
  saveSudokuState();
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
  saveSudokuState();
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
  clearSudokuSave();
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
  clearSudokuSave();
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
