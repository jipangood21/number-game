/**
 * 사용자 인증 관련 UI 제어 및 모달 시스템
 * 로그인, 회원가입, 로그아웃 처리 연동을 담당합니다.
 */

// DOM 요소 참조
const authModal = document.getElementById("auth-modal");
const authModalBackdrop = document.getElementById("auth-modal-backdrop");
const authTabs = document.querySelectorAll(".auth-tab");
const authFormLogin = document.getElementById("auth-form-login");
const authFormRegister = document.getElementById("auth-form-register");
const authErrorEl = document.getElementById("auth-error");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const registerUsernameInput = document.getElementById("register-username");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");
const btnOpenLogin = document.getElementById("btn-open-login");
const btnAuthClose = document.getElementById("btn-auth-close");
const authWelcomeEl = document.getElementById("auth-welcome");

// 모달 내 로그아웃 관련 요소
const authLogoutSection = document.getElementById("auth-logout-section");
const authLogoutWelcome = document.getElementById("auth-logout-welcome");
const btnModalLogout = document.getElementById("btn-modal-logout");
const authModalTabs = document.querySelector(".auth-tabs");

let authMode = "login"; // 'login' 또는 'register'

/** 에러 메시지 표시 (다국어 키 기반) */
function setAuthError(key) {
  if (authErrorEl) authErrorEl.textContent = key ? t(`auth.error.${key}`) : "";
}

/** 로그인/회원가입 탭 전환 */
function switchAuthTab(mode) {
  authMode = mode;
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authTab === mode);
  });
  if (authFormLogin) authFormLogin.hidden = mode !== "login";
  if (authFormRegister) authFormRegister.hidden = mode !== "register";
  if (authLogoutSection) authLogoutSection.hidden = true;
  setAuthError("");
}

/** 인증 모달 열기 (로그인 여부에 따라 화면 구성 자동 변경) */
function openAuthModal(mode = "login") {
  if (isLoggedIn()) {
    // 로그인 상태: 로그아웃 세션 활성화
    if (authLogoutSection) authLogoutSection.hidden = false;
    if (authFormLogin) authFormLogin.hidden = true;
    if (authFormRegister) authFormRegister.hidden = true;
    if (authModalTabs) authModalTabs.style.display = "none";
    if (authLogoutWelcome) authLogoutWelcome.textContent = t("auth.welcome", { name: getCurrentUsername() });
  } else {
    // 로그아웃 상태: 입력 폼 활성화
    if (authLogoutSection) authLogoutSection.hidden = true;
    if (authModalTabs) authModalTabs.style.display = "flex";
    switchAuthTab(mode);
  }
  if (authModal) authModal.classList.add("active");
  if (!isLoggedIn()) {
    setTimeout(() => {
      if (mode === "login" && loginUsernameInput) loginUsernameInput.focus();
      else if (registerUsernameInput) registerUsernameInput.focus();
    }, 100);
  }
}

/** 모달 닫기 */
function closeAuthModal() {
  if (authModal) authModal.classList.remove("active");
  setAuthError("");
  if (authFormLogin) authFormLogin.reset();
  if (authFormRegister) authFormRegister.reset();
}

/** 메인 바의 인증 버튼/텍스트 렌더링 */
function renderAuthBar() {
  const isLoggedInUser = isLoggedIn();
  if (isLoggedInUser) {
    if (authWelcomeEl) authWelcomeEl.textContent = t("auth.welcome", { name: getCurrentUsername() });
    if (btnOpenLogin) btnOpenLogin.textContent = t("auth.logout");
    if (typeof loadProfileForUser === "function") loadProfileForUser();
  } else {
    if (authWelcomeEl) authWelcomeEl.textContent = "";
    if (btnOpenLogin) btnOpenLogin.textContent = t("auth.login");
    if (typeof loadGuestProfile === "function") loadGuestProfile();
  }
}

/** 로그인 요청 처리 */
async function handleLogin(e) {
  e.preventDefault();
  setAuthError("");
  const result = await loginUser(
    loginUsernameInput.value,
    loginPasswordInput.value
  );
  if (!result.ok) {
    setAuthError(result.error);
    return;
  }
  closeAuthModal();
  renderAuthBar();
  if (typeof onAuthStateChanged === "function") onAuthStateChanged();
}

/** 회원가입 요청 처리 */
async function handleRegister(e) {
  e.preventDefault();
  setAuthError("");
  const password = registerPasswordInput.value;
  const confirm = registerPasswordConfirmInput.value;
  if (password !== confirm) {
    setAuthError("passwordMismatch");
    return;
  }
  const result = await registerUser(registerUsernameInput.value, password);
  if (!result.ok) {
    setAuthError(result.error);
    return;
  }
  
  // 가입 후 자동 로그인
  await loginUser(registerUsernameInput.value, password);
  closeAuthModal();
  renderAuthBar();
  if (typeof onAuthStateChanged === "function") onAuthStateChanged();
}

/** 로그아웃 처리 */
function handleLogout() {
  logoutUser();
  renderAuthBar();
  closeAuthModal();
  if (typeof onAuthStateChanged === "function") onAuthStateChanged();
}

/** 로그인이 필수인 기능 실행 전 체크 */
function requireLogin(action) {
  if (isLoggedIn()) {
    action();
    return;
  }
  openAuthModal("login");
}

/** 인증 시스템 초기화 */
function initAuth() {
  if (btnOpenLogin) btnOpenLogin.addEventListener("click", () => openAuthModal("login"));
  if (btnAuthClose) btnAuthClose.addEventListener("click", closeAuthModal);
  if (authModalBackdrop) authModalBackdrop.addEventListener("click", closeAuthModal);
  
  if (btnModalLogout) btnModalLogout.addEventListener("click", handleLogout);
  
  if (authFormLogin) authFormLogin.addEventListener("submit", handleLogin);
  if (authFormRegister) authFormRegister.addEventListener("submit", handleRegister);

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
  });

  renderAuthBar();
}

/** 다국어 전환 시 텍스트 갱신 */
function refreshAuthTranslations() {
  document.querySelectorAll("[data-i18n-auth]").forEach((el) => {
    el.textContent = t(el.dataset.i18nAuth);
  });
  if (loginUsernameInput) loginUsernameInput.placeholder = t("auth.usernamePlaceholder");
  if (loginPasswordInput) loginPasswordInput.placeholder = t("auth.passwordPlaceholder");
  if (registerUsernameInput) registerUsernameInput.placeholder = t("auth.usernamePlaceholder");
  if (registerPasswordInput) registerPasswordInput.placeholder = t("auth.passwordPlaceholder");
  if (registerPasswordConfirmInput) registerPasswordConfirmInput.placeholder = t("auth.passwordConfirmPlaceholder");
  if (isLoggedIn() && authWelcomeEl) {
    authWelcomeEl.textContent = t("auth.welcome", { name: getCurrentUsername() });
  }
}
