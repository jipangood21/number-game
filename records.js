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
  if (record.metric === "attempts") {
    return t("record.bestAttempts", { n: record.value });
  }
  return t("record.bestTime", { n: record.value });
}

function getRecordMetaLine(gameId, difficultyKey, digits) {
  if (!isLoggedIn()) return t("record.loginRequired");
  const record = getBestRecord(gameId, difficultyKey, digits);
  if (!record) return t("record.none");
  return formatRecordValue(record);
}

function isBetterRecord(current, value, metric) {
  if (!current) return true;
  return value < current.value;
}

function tryUpdateRecord({ gameId, difficultyKey, digits, value, metric }) {
  if (!isLoggedIn()) return { saved: false };

  const key = buildRecordKey(gameId, difficultyKey, digits);
  const records = getCurrentRecords();
  const current = records[key];
  const isNew = isBetterRecord(current, value, metric);

  if (isNew) {
    saveRecordEntry(key, {
      value,
      metric,
      updatedAt: Date.now(),
    });
    return { saved: true, isNew: true, previous: current };
  }

  return { saved: true, isNew: false, best: current };
}

function appendRecordToResult(parts, recordResult) {
  if (!recordResult?.saved) return parts;
  if (recordResult.isNew) {
    parts.push(t("record.newBest"));
  } else if (recordResult.best) {
    parts.push(`${t("record.best")} ${formatRecordValue(recordResult.best)}`);
  }
  return parts;
}
