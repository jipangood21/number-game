const authBarEl = document.getElementById("auth-bar");
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
const btnAuthLogin = document.getElementById("btn-auth-login");
const btnAuthRegister = document.getElementById("btn-auth-register");
const btnAuthLogout = document.getElementById("btn-auth-logout");
const btnOpenLogin = document.getElementById("btn-open-login");
const btnOpenRegister = document.getElementById("btn-open-register");
const btnAuthClose = document.getElementById("btn-auth-close");
const authLoggedInEl = document.getElementById("auth-logged-in");
const authLoggedOutEl = document.getElementById("auth-logged-out");
const authWelcomeEl = document.getElementById("auth-welcome");

let authMode = "login";

function setAuthError(key) {
  authErrorEl.textContent = key ? t(`auth.error.${key}`) : "";
}

function switchAuthTab(mode) {
  authMode = mode;
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authTab === mode);
  });
  authFormLogin.hidden = mode !== "login";
  authFormRegister.hidden = mode !== "register";
  setAuthError("");
}

function openAuthModal(mode = "login") {
  switchAuthTab(mode);
  authModal.classList.add("active");
  if (mode === "login") loginUsernameInput.focus();
  else registerUsernameInput.focus();
}

function closeAuthModal() {
  authModal.classList.remove("active");
  setAuthError("");
  authFormLogin.reset();
  authFormRegister.reset();
}

function renderAuthBar() {
  if (isLoggedIn()) {
    authLoggedOutEl.hidden = true;
    authLoggedInEl.hidden = false;
    authWelcomeEl.textContent = t("auth.welcome", { name: getCurrentUsername() });
    if (typeof loadProfileForUser === "function") loadProfileForUser();
  } else {
    authLoggedOutEl.hidden = false;
    authLoggedInEl.hidden = true;
    if (typeof loadGuestProfile === "function") loadGuestProfile();
  }
}

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
  closeAuthModal();
  renderAuthBar();
  if (typeof onAuthStateChanged === "function") onAuthStateChanged();
}

function handleLogout() {
  logoutUser();
  renderAuthBar();
  if (typeof onAuthStateChanged === "function") onAuthStateChanged();
}

function requireLogin(action) {
  if (isLoggedIn()) {
    action();
    return;
  }
  openAuthModal("login");
}

function initAuth() {
  renderAuthBar();

  btnOpenLogin.addEventListener("click", () => openAuthModal("login"));
  btnOpenRegister.addEventListener("click", () => openAuthModal("register"));
  btnAuthClose.addEventListener("click", closeAuthModal);
  authModalBackdrop.addEventListener("click", closeAuthModal);
  btnAuthLogout.addEventListener("click", handleLogout);
  authFormLogin.addEventListener("submit", handleLogin);
  authFormRegister.addEventListener("submit", handleRegister);

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
  });
}

function refreshAuthTranslations() {
  document.querySelectorAll("[data-i18n-auth]").forEach((el) => {
    el.textContent = t(el.dataset.i18nAuth);
  });
  loginUsernameInput.placeholder = t("auth.usernamePlaceholder");
  loginPasswordInput.placeholder = t("auth.passwordPlaceholder");
  registerUsernameInput.placeholder = t("auth.usernamePlaceholder");
  registerPasswordInput.placeholder = t("auth.passwordPlaceholder");
  registerPasswordConfirmInput.placeholder = t("auth.passwordConfirmPlaceholder");
  if (isLoggedIn()) {
    authWelcomeEl.textContent = t("auth.welcome", { name: getCurrentUsername() });
  }
}
