const DEFAULT_PROFILE = {
  nickname: "Guest",
  avatar: null,
};

let profileState = { ...DEFAULT_PROFILE };

const profileWidget = document.getElementById("profile-widget");
const profileAvatarWrap = profileWidget.querySelector(".profile-avatar-wrap");
const profileAvatarEl = document.getElementById("profile-avatar");
const profileNicknameEl = document.getElementById("profile-nickname");
const profileEditAvatarWrap = document.querySelector(".profile-avatar-wrap--large");
const profileModal = document.getElementById("profile-modal");
const profileEditPreview = document.getElementById("profile-edit-preview");
const profileAvatarInput = document.getElementById("profile-avatar-input");
const profileNicknameInput = document.getElementById("profile-nickname-input");
const btnProfileSave = document.getElementById("profile-save");
const btnProfileClose = document.getElementById("profile-close");
const btnProfileRemoveAvatar = document.getElementById("profile-remove-avatar");
const profileModalBackdrop = document.getElementById("profile-modal-backdrop");
const profileLoginNotice = document.getElementById("profile-login-notice");

function loadGuestProfile() {
  profileState = { ...DEFAULT_PROFILE, nickname: t("profile.guest") };
  renderProfileWidget();
}

function loadProfileForUser() {
  const saved = getCurrentProfile();
  profileState = saved
    ? { nickname: saved.nickname, avatar: saved.avatar }
    : { nickname: getCurrentUsername(), avatar: null };
  renderProfileWidget();
}

function getProfileInitial(name) {
  const text = (name || "?").trim();
  return (text[0] || "?").toUpperCase();
}

function setAvatarElement(el, avatar, nickname) {
  if (avatar) {
    el.src = avatar;
    el.hidden = false;
    el.classList.remove("profile-avatar--empty");
    el.alt = nickname;
  } else {
    el.removeAttribute("src");
    el.hidden = true;
    el.classList.add("profile-avatar--empty");
    el.alt = "";
  }
}

function updateProfileInitials(name) {
  const initial = getProfileInitial(name ?? profileNicknameInput?.value ?? profileState.nickname);
  profileAvatarWrap.dataset.initial = initial;
  if (profileEditAvatarWrap) profileEditAvatarWrap.dataset.initial = initial;
}

function renderProfileWidget() {
  setAvatarElement(profileAvatarEl, profileState.avatar, profileState.nickname);
  profileNicknameEl.textContent = profileState.nickname;
  updateProfileInitials();
}

function fillProfileModal() {
  delete profileEditPreview.dataset.pendingAvatar;
  profileLoginNotice.hidden = isLoggedIn();
  profileNicknameInput.disabled = !isLoggedIn();
  btnProfileSave.disabled = !isLoggedIn();
  profileAvatarInput.disabled = !isLoggedIn();
  btnProfileRemoveAvatar.disabled = !isLoggedIn();

  if (!isLoggedIn()) {
    profileEditPreview.hidden = true;
    profileEditPreview.classList.add("profile-avatar--empty");
    profileNicknameInput.value = "";
    updateProfileInitials(t("profile.guest"));
    return;
  }

  setAvatarElement(profileEditPreview, profileState.avatar, profileState.nickname);
  profileNicknameInput.value = profileState.nickname;
  updateProfileInitials(profileState.nickname);
}

function openProfileModal() {
  if (!isLoggedIn()) {
    requireLogin(() => openProfileModal());
    return;
  }
  fillProfileModal();
  profileModal.classList.add("active");
  profileNicknameInput.focus();
}

function closeProfileModal() {
  profileModal.classList.remove("active");
  profileAvatarInput.value = "";
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("invalid"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("size"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

function initProfile() {
  if (isLoggedIn()) loadProfileForUser();
  else loadGuestProfile();

  profileWidget.addEventListener("click", openProfileModal);
  profileModalBackdrop.addEventListener("click", closeProfileModal);
  btnProfileClose.addEventListener("click", closeProfileModal);

  profileAvatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      profileEditPreview.src = dataUrl;
      profileEditPreview.hidden = false;
      profileEditPreview.classList.remove("profile-avatar--empty");
      profileEditPreview.dataset.pendingAvatar = dataUrl;
      updateProfileInitials(profileNicknameInput.value);
    } catch (err) {
      if (err.message === "size") alert(t("profile.error.size"));
      else alert(t("profile.error.image"));
      profileAvatarInput.value = "";
    }
  });

  btnProfileRemoveAvatar.addEventListener("click", () => {
    delete profileEditPreview.dataset.pendingAvatar;
    profileEditPreview.removeAttribute("src");
    profileEditPreview.hidden = true;
    profileEditPreview.classList.add("profile-avatar--empty");
    profileAvatarInput.value = "";
    updateProfileInitials(profileNicknameInput.value);
  });

  profileNicknameInput.addEventListener("input", () => {
    updateProfileInitials(profileNicknameInput.value);
  });

  btnProfileSave.addEventListener("click", () => {
    if (!isLoggedIn()) {
      requireLogin(() => openProfileModal());
      return;
    }

    const nickname =
      profileNicknameInput.value.trim() || getCurrentUsername() || DEFAULT_PROFILE.nickname;
    profileState.nickname = nickname.slice(0, 12);

    if (profileEditPreview.dataset.pendingAvatar) {
      profileState.avatar = profileEditPreview.dataset.pendingAvatar;
    } else if (
      profileEditPreview.hidden ||
      profileEditPreview.classList.contains("profile-avatar--empty")
    ) {
      profileState.avatar = null;
    }

    saveCurrentProfile({
      nickname: profileState.nickname,
      avatar: profileState.avatar,
    });
    renderProfileWidget();
    closeProfileModal();
  });
}

function refreshProfileTranslations() {
  document.querySelectorAll("[data-i18n-profile]").forEach((el) => {
    el.textContent = t(el.dataset.i18nProfile);
  });
  profileNicknameInput.placeholder = t("profile.nicknamePlaceholder");
  if (!isLoggedIn()) loadGuestProfile();
}

