function padNumber(num, digits) {
  return String(num).padStart(digits, "0");
}

function calculateStrikeBall(answer, guess, digits) {
  const answerStr = padNumber(answer, digits);
  const guessStr = padNumber(guess, digits);
  let strikes = 0;
  const answerUsed = Array(digits).fill(false);
  const guessUsed = Array(digits).fill(false);

  for (let i = 0; i < digits; i += 1) {
    if (guessStr[i] === answerStr[i]) {
      strikes += 1;
      answerUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  let balls = 0;
  for (let i = 0; i < digits; i += 1) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < digits; j += 1) {
      if (answerUsed[j]) continue;
      if (guessStr[i] === answerStr[j]) {
        balls += 1;
        answerUsed[j] = true;
        guessUsed[i] = true;
        break;
      }
    }
  }

  const outs = digits - strikes - balls;
  return { strikes, balls, outs };
}

function isValidBaseballGuess(raw, digits, minVal, maxVal) {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return { valid: false, reason: "invalid" };
  if (trimmed.length !== digits) return { valid: false, reason: "length" };
  const value = Number(trimmed);
  if (value < minVal || value > maxVal) return { valid: false, reason: "range" };
  return { valid: true, value };
}

function formatBaseballHint(strikes, balls, outs) {
  return t("baseball.feedback", { s: strikes, b: balls, o: outs });
}

function getPositionLabel(index) {
  return t(`baseball.hint.pos.${index + 1}`);
}

function formatDigitHint(hintData) {
  const pos = getPositionLabel(hintData.pos);
  if (hintData.type === "lessThan") {
    return t("baseball.hint.lessThan", { pos, n: hintData.n });
  }
  return t("baseball.hint.greaterThan", { pos, n: hintData.n });
}

function generateDigitHint(answer, digits, usedKeys) {
  const answerStr = padNumber(answer, digits);
  const positions = Array.from({ length: digits }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );

  for (const pos of positions) {
    const digit = Number(answerStr[pos]);
    const candidates = [];

    for (let n = digit + 1; n <= 9; n += 1) {
      const key = `${pos}-lt-${n}`;
      if (!usedKeys.has(key)) {
        candidates.push({ key, type: "lessThan", pos, n });
      }
    }
    for (let n = 0; n < digit; n += 1) {
      const key = `${pos}-gt-${n}`;
      if (!usedKeys.has(key)) {
        candidates.push({ key, type: "greaterThan", pos, n });
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  return null;
}
