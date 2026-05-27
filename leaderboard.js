/**
 * 리더보드 UI — 게임별 / 카테고리별 전체 유저 순위 표시
 */

const LEADERBOARD_CATEGORIES = {
  guess: [
    { subKey: "2-n", labelFn: () => `${t("digit.unit", { n: 2 })} · ${t("difficulty.normal")}`, digits: 2, difficultyKey: "normal" },
    { subKey: "3-n", labelFn: () => `${t("digit.unit", { n: 3 })} · ${t("difficulty.normal")}`, digits: 3, difficultyKey: "normal" },
    { subKey: "4-n", labelFn: () => `${t("digit.unit", { n: 4 })} · ${t("difficulty.normal")}`, digits: 4, difficultyKey: "normal" },
    { subKey: "5-n", labelFn: () => `${t("digit.unit", { n: 5 })} · ${t("difficulty.normal")}`, digits: 5, difficultyKey: "normal" },
    { subKey: "6-n", labelFn: () => `${t("digit.unit", { n: 6 })} · ${t("difficulty.normal")}`, digits: 6, difficultyKey: "normal" },
  ],
  baseball: [
    { subKey: "3", labelFn: () => t("digit.unit", { n: 3 }), digits: 3, difficultyKey: "none" },
    { subKey: "4", labelFn: () => t("digit.unit", { n: 4 }), digits: 4, difficultyKey: "none" },
    { subKey: "5", labelFn: () => t("digit.unit", { n: 5 }), digits: 5, difficultyKey: "none" },
    { subKey: "6", labelFn: () => t("digit.unit", { n: 6 }), digits: 6, difficultyKey: "none" },
  ],
  sudoku: [
    { subKey: "easy",   labelFn: () => t("difficulty.easy"),   digits: null, difficultyKey: "easy" },
    { subKey: "normal", labelFn: () => t("difficulty.normal"), digits: null, difficultyKey: "normal" },
    { subKey: "hard",   labelFn: () => t("difficulty.hard"),   digits: null, difficultyKey: "hard" },
  ],
  blockblast: [
    { subKey: "easy",   labelFn: () => t("difficulty.easy"),   digits: null, difficultyKey: "easy" },
    { subKey: "normal", labelFn: () => t("difficulty.normal"), digits: null, difficultyKey: "normal" },
    { subKey: "hard",   labelFn: () => t("difficulty.hard"),   digits: null, difficultyKey: "hard" },
  ],
};

Object.assign(LEADERBOARD_CATEGORIES, {
  brickbreaker: [
    { subKey: "easy",   labelFn: () => t("difficulty.easy"),   digits: null, difficultyKey: "easy" },
    { subKey: "normal", labelFn: () => t("difficulty.normal"), digits: null, difficultyKey: "normal" },
    { subKey: "hard",   labelFn: () => t("difficulty.hard"),   digits: null, difficultyKey: "hard" },
  ],
});

const LEADERBOARD_GAME_ORDER = ["guess", "baseball", "sudoku", "blockblast", "brickbreaker"];

let lbActiveGame = "guess";
let lbActiveSub  = null;

const leaderboardModal         = document.getElementById("leaderboard-modal");
const leaderboardModalBackdrop = document.getElementById("leaderboard-modal-backdrop");
const leaderboardGameTabsEl    = document.getElementById("leaderboard-game-tabs");
const leaderboardSubTabsEl     = document.getElementById("leaderboard-sub-tabs");
const leaderboardListEl        = document.getElementById("leaderboard-list");
const btnLeaderboardClose      = document.getElementById("leaderboard-close");
const btnOpenLeaderboard       = document.getElementById("btn-open-leaderboard");
const btnResultLeaderboard     = document.getElementById("btn-result-leaderboard");

function openLeaderboard(gameId) {
  if (gameId && LEADERBOARD_CATEGORIES[gameId]) lbActiveGame = gameId;
  const cats = LEADERBOARD_CATEGORIES[lbActiveGame];
  if (!lbActiveSub || !cats.find(c => c.subKey === lbActiveSub)) {
    lbActiveSub = cats[0].subKey;
  }
  renderLeaderboardGameTabs();
  renderLeaderboardSubTabs();
  renderLeaderboardList();
  leaderboardModal.classList.add("active");
}

function closeLeaderboard() {
  leaderboardModal.classList.remove("active");
}

function setLbGame(gameId) {
  lbActiveGame = gameId;
  lbActiveSub  = LEADERBOARD_CATEGORIES[gameId][0].subKey;
  renderLeaderboardGameTabs();
  renderLeaderboardSubTabs();
  renderLeaderboardList();
}

function setLbSub(subKey) {
  lbActiveSub = subKey;
  renderLeaderboardSubTabs();
  renderLeaderboardList();
}

function renderLeaderboardGameTabs() {
  leaderboardGameTabsEl.innerHTML = LEADERBOARD_GAME_ORDER.map(gameId => {
    const active = gameId === lbActiveGame ? " active" : "";
    return `<button type="button" class="lb-game-tab${active}" data-game="${gameId}">${t(`game.${gameId}.name`)}</button>`;
  }).join("");

  leaderboardGameTabsEl.querySelectorAll(".lb-game-tab").forEach(btn => {
    btn.addEventListener("click", () => setLbGame(btn.dataset.game));
  });
}

function renderLeaderboardSubTabs() {
  const cats = LEADERBOARD_CATEGORIES[lbActiveGame];
  leaderboardSubTabsEl.innerHTML = cats.map(cat => {
    const active = cat.subKey === lbActiveSub ? " active" : "";
    return `<button type="button" class="lb-sub-tab${active}" data-sub="${cat.subKey}">${cat.labelFn()}</button>`;
  }).join("");

  leaderboardSubTabsEl.querySelectorAll(".lb-sub-tab").forEach(btn => {
    btn.addEventListener("click", () => setLbSub(btn.dataset.sub));
  });
}

function lbFormatValue(value, metric) {
  if (metric === "attempts") return t("record.bestAttempts", { n: value });
  if (metric === "time")     return t("record.bestTime",     { n: value });
  if (metric === "score")    return t("record.bestScore",    { n: value });
  return String(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLeaderboardList() {
  const cats = LEADERBOARD_CATEGORIES[lbActiveGame];
  const cat  = cats.find(c => c.subKey === lbActiveSub);
  if (!cat) return;

  const entries = buildLeaderboard(lbActiveGame, cat.difficultyKey, cat.digits);

  if (entries.length === 0) {
    leaderboardListEl.innerHTML = `<p class="lb-empty">${t("leaderboard.empty")}</p>`;
    return;
  }

  const RANK_MEDALS = ["🥇", "🥈", "🥉"];
  const top10 = entries.slice(0, 10);

  const rows = top10.map(e => {
    const rankLabel = e.rank <= 3 ? RANK_MEDALS[e.rank - 1] : String(e.rank);
    const rankCls   = e.rank <= 3 ? ` lb-rank-top${e.rank}` : "";
    const selfCls   = e.isCurrentUser ? " lb-self" : "";
    const plays     = t("record.playCount", { n: e.playCount });
    return `
      <div class="lb-row${selfCls}">
        <span class="lb-rank${rankCls}">${rankLabel}</span>
        <span class="lb-name">${escapeHtml(e.nickname)}</span>
        <span class="lb-meta">${plays}</span>
        <span class="lb-value">${lbFormatValue(e.value, e.metric)}</span>
      </div>`;
  }).join("");

  // 현재 유저가 10위 밖이면 구분선 뒤에 표시
  const currentEntry = entries.find(e => e.isCurrentUser);
  const tail = (currentEntry && currentEntry.rank > 10)
    ? `<div class="lb-divider">···</div>
       <div class="lb-row lb-self">
         <span class="lb-rank">${currentEntry.rank}</span>
         <span class="lb-name">${escapeHtml(currentEntry.nickname)}</span>
         <span class="lb-meta">${t("record.playCount", { n: currentEntry.playCount })}</span>
         <span class="lb-value">${lbFormatValue(currentEntry.value, currentEntry.metric)}</span>
       </div>`
    : "";

  leaderboardListEl.innerHTML = rows + tail;
}

/** 언어 변경 시 모달이 열려있으면 재렌더링 */
function refreshLeaderboardTranslations() {
  if (!leaderboardModal.classList.contains("active")) return;
  renderLeaderboardGameTabs();
  renderLeaderboardSubTabs();
  renderLeaderboardList();
}

function initLeaderboard() {
  btnOpenLeaderboard?.addEventListener("click",  () => openLeaderboard());
  btnResultLeaderboard?.addEventListener("click", () => openLeaderboard(lastResultGameId));
  btnLeaderboardClose?.addEventListener("click",  closeLeaderboard);
  leaderboardModalBackdrop?.addEventListener("click", closeLeaderboard);
}
