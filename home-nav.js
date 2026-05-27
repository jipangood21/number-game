/* 홈 이동 로고 (추가) */

const HOME_NAV_SCREENS = new Set([
  "select",
  "difficulty",
  "play",
  "baseballSelect",
  "baseballPlay",
  "sudokuSelect",
  "sudokuPlay",
  "blockblastSelect",
  "blockblastPlay",
  "brickbreakerSelect",
  "brickbreakerPlay",
  "result",
]);

const btnHomeLogo = document.getElementById("btn-home-logo");

function updateHomeNavVisibility(screenName) {
  if (!btnHomeLogo) return;
  btnHomeLogo.classList.toggle("visible", HOME_NAV_SCREENS.has(screenName));
}

function initHomeNav() {
  if (!btnHomeLogo) return;
  btnHomeLogo.addEventListener("click", () => {
    if (typeof goHome === "function") goHome();
  });
  updateHomeNavVisibility("home");
}

function refreshHomeNavLabel() {
  if (!btnHomeLogo) return;
  btnHomeLogo.textContent = t("nav.homeLogo");
  btnHomeLogo.setAttribute("aria-label", t("nav.homeAria"));
}
