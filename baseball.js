/**
 * 숫자야구 게임 핵심 로직 엔진
 * 정답 생성, 스트라이크/볼 판정, 힌트 생성 기능을 담당합니다.
 */

/** 숫자를 지정된 자릿수만큼 0으로 채움 (예: 7 -> "007") */
function padNumber(num, digits) {
  return String(num).padStart(digits, "0");
}

/** 
 * 스트라이크와 볼 개수 계산
 * @param {number} answer 정답 숫자
 * @param {number} guess 사용자 입력 숫자
 * @param {number} digits 자릿수
 * @returns {object} { strikes, balls, outs }
 */
function calculateStrikeBall(answer, guess, digits) {
  const answerStr = padNumber(answer, digits);
  const guessStr = padNumber(guess, digits);
  let strikes = 0;
  const answerUsed = Array(digits).fill(false);
  const guessUsed = Array(digits).fill(false);

  // 1단계: 스트라이크 판정 (숫자와 자리가 모두 일치)
  for (let i = 0; i < digits; i += 1) {
    if (guessStr[i] === answerStr[i]) {
      strikes += 1;
      answerUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // 2단계: 볼 판정 (숫자는 일치하나 자리가 다름)
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

/** 입력값 유효성 검사 (숫자 여부, 길이, 범위 체크) */
function isValidBaseballGuess(raw, digits, minVal, maxVal) {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return { valid: false, reason: "invalid" };
  if (trimmed.length !== digits) return { valid: false, reason: "length" };
  const value = Number(trimmed);
  if (value < minVal || value > maxVal) return { valid: false, reason: "range" };
  return { valid: true, value };
}

/** 판정 결과를 텍스트로 변환 (다국어 지원) */
function formatBaseballHint(strikes, balls, outs) {
  return t("baseball.feedback", { s: strikes, b: balls, o: outs });
}

/** 힌트 위치 레이블 (첫 번째 자리, 두 번째 자리...) 반환 */
function getPositionLabel(index) {
  return t(`baseball.hint.pos.${index + 1}`);
}

/** 힌트 데이터를 사람이 읽기 쉬운 텍스트로 변환 */
function formatDigitHint(hintData) {
  const pos = getPositionLabel(hintData.pos);
  if (hintData.type === "lessThan") {
    return t("baseball.hint.lessThan", { pos, n: hintData.n });
  }
  return t("baseball.hint.greaterThan", { pos, n: hintData.n });
}

/** 무작위 힌트(크다/작다 힌트) 데이터 생성 */
function generateDigitHint(answer, digits, usedKeys) {
  const answerStr = padNumber(answer, digits);
  const positions = Array.from({ length: digits }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );

  for (const pos of positions) {
    const digit = Number(answerStr[pos]);
    const candidates = [];

    // 'n보다 작다' 힌트 후보 생성
    for (let n = digit + 1; n <= 9; n += 1) {
      const key = `${pos}-lt-${n}`;
      if (!usedKeys.has(key)) {
        candidates.push({ key, type: "lessThan", pos, n });
      }
    }
    // 'n보다 크다' 힌트 후보 생성
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

/** 랜덤 정수 생성 (내부 유틸) */
function baseballLocalRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 배열 무작위 셔플 (내부 유틸) */
function baseballLocalShuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 숫자에 중복된 자릿수가 포함되어 있는지 체크 */
function baseballDigitsHaveDuplicate(num, digits) {
  const s = padNumber(num, digits);
  return new Set(s).size !== s.length;
}

/** 중복 허용 여부에 따른 숫자야구 정답 생성 */
function generateBaseballAnswerWithMode(minVal, maxVal, digits, allowDuplicate) {
  if (allowDuplicate) {
    return baseballLocalRandomInt(minVal, maxVal);
  }
  // 중복 비허용 시: 무작위 숫자 중 중복 없는 것 추출 시도
  for (let i = 0; i < 8000; i += 1) {
    const picked = baseballLocalShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, digits);
    const value = Number(picked.join(""));
    if (
      value >= minVal &&
      value <= maxVal &&
      !baseballDigitsHaveDuplicate(value, digits)
    ) {
      return value;
    }
  }
  return baseballLocalRandomInt(minVal, maxVal); // 실패 대비 폴백
}

/** 중복 여부를 포함한 입력값 최종 유효성 검사 */
function checkBaseballGuessWithMode(raw, digits, minVal, maxVal, allowDuplicate) {
  const base = isValidBaseballGuess(raw, digits, minVal, maxVal);
  if (!base.valid) return base;
  if (allowDuplicate) return base;
  if (baseballDigitsHaveDuplicate(base.value, digits)) {
    return { valid: false, reason: "duplicate" };
  }
  return base;
}
