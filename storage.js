const USERS_KEY = "ng_users";
const SESSION_KEY = "ng_session";
const LEGACY_PROFILE_KEY = "userProfile";

function userDataKey(userId) {
  return `ng_data_${userId}`;
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return Boolean(getSession()?.userId);
}

function getCurrentUserId() {
  return getSession()?.userId || null;
}

function getCurrentUsername() {
  return getSession()?.username || "";
}

function getDefaultUserData(username) {
  return {
    profile: {
      nickname: username,
      avatar: null,
    },
    records: {},
  };
}

function getUserData(userId) {
  try {
    const raw = localStorage.getItem(userDataKey(userId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      profile: data.profile || { nickname: "Player", avatar: null },
      records: data.records || {},
    };
  } catch {
    return null;
  }
}

function saveUserData(userId, data) {
  localStorage.setItem(userDataKey(userId), JSON.stringify(data));
}

function migrateLegacyProfile(userId, username) {
  try {
    const raw = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw);
    const data = getUserData(userId) || getDefaultUserData(username);
    data.profile = {
      nickname: legacy.nickname || username,
      avatar: legacy.avatar || null,
    };
    saveUserData(userId, data);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

async function registerUser(username, password) {
  const name = username.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "usernameShort" };
  if (!/^[a-z0-9_]+$/.test(name)) return { ok: false, error: "usernameInvalid" };
  if (password.length < 4) return { ok: false, error: "passwordShort" };

  const users = getUsers();
  if (users[name]) return { ok: false, error: "usernameTaken" };

  const passwordHash = await hashPassword(password);
  const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  users[name] = { userId, passwordHash, createdAt: Date.now() };
  saveUsers(users);

  const data = getDefaultUserData(name);
  saveUserData(userId, data);
  migrateLegacyProfile(userId, name);

  setSession({ userId, username: name });
  return { ok: true };
}

async function loginUser(username, password) {
  const name = username.trim().toLowerCase();
  const users = getUsers();
  const user = users[name];
  if (!user) return { ok: false, error: "invalidLogin" };

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) return { ok: false, error: "invalidLogin" };

  setSession({ userId: user.userId, username: name });

  if (!getUserData(user.userId)) {
    saveUserData(user.userId, getDefaultUserData(name));
  }
  migrateLegacyProfile(user.userId, name);

  return { ok: true };
}

function logoutUser() {
  clearSession();
}

function getCurrentUserData() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return getUserData(userId) || getDefaultUserData(getCurrentUsername());
}

function saveCurrentUserData(data) {
  const userId = getCurrentUserId();
  if (!userId) return false;
  saveUserData(userId, data);
  return true;
}

function getCurrentProfile() {
  return getCurrentUserData()?.profile || null;
}

function saveCurrentProfile(profile) {
  const data = getCurrentUserData();
  if (!data) return false;
  data.profile = profile;
  return saveCurrentUserData(data);
}

function getCurrentRecords() {
  return getCurrentUserData()?.records || {};
}

function saveRecordEntry(key, record) {
  const data = getCurrentUserData();
  if (!data) return false;
  data.records[key] = record;
  return saveCurrentUserData(data);
}

/** 모든 등록 유저의 프로필 + 기록 배열 반환 (리더보드용) */
function getAllUsersRecords() {
  const users = getUsers();
  return Object.entries(users).map(([username, userInfo]) => {
    const data = getUserData(userInfo.userId);
    return {
      userId:   userInfo.userId,
      username,
      nickname: data?.profile?.nickname || username,
      records:  data?.records || {},
    };
  });
}
