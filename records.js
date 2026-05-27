function buildRecordKey(gameId, difficultyKey, digits) {
  return `${gameId}|${digits ?? "none"}|${difficultyKey ?? "none"}`;
}

function getBestRecord(gameId, difficultyKey, digits) {
  if (!isLoggedIn()) return null;
  const key = buildRecordKey(gameId, difficultyKey, digits);
  return getCurrentRecords()[key] || null;
}

function formatRecordValue(record) {
  if (!record) return "";
  if (record.metric === "attempts") return t("record.bestAttempts", { n: record.value });
  if (record.metric === "score")    return t("record.bestScore",    { n: record.value });
  return t("record.bestTime", { n: record.value });
}

function getRecordMetaLine(gameId, difficultyKey, digits) {
  if (!isLoggedIn()) return t("record.loginRequired");
  const record = getBestRecord(gameId, difficultyKey, digits);
  if (!record) return t("record.none");
  const plays = record.history?.length || 1;
  return `${formatRecordValue(record)}  ·  ${t("record.playCount", { n: plays })}`;
}

function isBetterRecord(current, value, metric) {
  if (!current) return true;
  if (metric === "score") return value > current.value;
  return value < current.value;
}

/** 기록 저장 — 항상 히스토리에 추가, best가 갱신될 때만 value 업데이트 */
function tryUpdateRecord({ gameId, difficultyKey, digits, value, metric }) {
  if (!isLoggedIn()) return { saved: false };

  const key     = buildRecordKey(gameId, difficultyKey, digits);
  const records = getCurrentRecords();
  const current = records[key];
  const isNew   = isBetterRecord(current, value, metric);
  const now     = Date.now();

  const history = current?.history ? [...current.history] : [];
  history.push({ value, date: now });
  if (history.length > 50) history.splice(0, history.length - 50);

  saveRecordEntry(key, {
    value:     isNew ? value : current.value,
    metric,
    updatedAt: isNew ? now : (current?.updatedAt || now),
    history,
  });

  return { saved: true, isNew, previous: current };
}

function appendRecordToResult(parts, recordResult) {
  if (!recordResult?.saved) return parts;
  if (recordResult.isNew) {
    parts.push(t("record.newBest"));
  } else if (recordResult.previous) {
    parts.push(`${t("record.best")} ${formatRecordValue(recordResult.previous)}`);
  }
  return parts;
}

/** 특정 카테고리의 전체 유저 기록을 정렬하여 반환 */
function buildLeaderboard(gameId, difficultyKey, digits) {
  const key           = buildRecordKey(gameId, difficultyKey, digits);
  const allUsers      = getAllUsersRecords();
  const currentUserId = getCurrentUserId();

  const entries = [];
  for (const user of allUsers) {
    const record = user.records[key];
    if (!record) continue;
    entries.push({
      userId:        user.userId,
      nickname:      user.nickname,
      value:         record.value,
      metric:        record.metric,
      updatedAt:     record.updatedAt,
      playCount:     record.history?.length || 1,
      isCurrentUser: user.userId === currentUserId,
    });
  }

  // score는 내림차순, attempts/time은 오름차순
  entries.sort((a, b) =>
    a.metric === "score" ? b.value - a.value : a.value - b.value
  );

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
