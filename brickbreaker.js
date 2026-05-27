/**
 * Brick Breaker — 게임 엔진
 * 캔버스 논리 해상도 480×600, CSS 스케일링으로 반응형 처리
 */

const BB_W = 480;
const BB_H = 600;

const BB_CONFIGS = {
  easy:   { rows: 4,  cols: 10, paddleW: 110, speed: 4.0, ballR: 9, lives: 5, hpMax: 1 },
  normal: { rows: 6,  cols: 12, paddleW: 80,  speed: 5.2, ballR: 8, lives: 3, hpMax: 2 },
  hard:   { rows: 8,  cols: 14, paddleW: 60,  speed: 6.5, ballR: 7, lives: 2, hpMax: 3 },
};

const BB_BRICK_GAP       = 4;
const BB_BRICK_TOP       = 55;
const BB_PADDLE_H        = 12;
const BB_PADDLE_Y        = BB_H - 48;
const BB_PADDLE_SPEED    = 420; // px/s
const BB_LEVEL_SPEED_INC = 0.08;


let bbState    = null;
let bbTimerId  = null;
let bbLastTime = null;

// ── 전역 입력 핸들러 (1회만 등록) ───────────────────────────
let bbMouseLogicalX = null;
let bbKeys = { left: false, right: false };
let bbInputRegistered = false;
let bbAim = { active: false, angle: -Math.PI / 2 };

function bbGetLogicalX(clientX) {
  if (!bbState?.canvas) return null;
  const rect = bbState.canvas.getBoundingClientRect();
  return (clientX - rect.left) * (BB_W / rect.width);
}

function bbGetLogicalY(clientY) {
  if (!bbState?.canvas) return null;
  const rect = bbState.canvas.getBoundingClientRect();
  return (clientY - rect.top) * (BB_H / rect.height);
}

function bbUpdateAimAngle(lx, ly) {
  if (!bbState) return;
  const b  = bbState.ball;
  const dx = lx - b.x;
  const dy = ly - b.y;
  if (dy >= 0) { bbAim.angle = -Math.PI / 2; return; }
  const MIN   = Math.PI / 8; // 22.5° 최소 이격각
  const raw   = Math.atan2(dy, dx);
  bbAim.angle = Math.max(-(Math.PI - MIN), Math.min(-MIN, raw));
}

function bbRegisterInput() {
  if (bbInputRegistered) return;
  bbInputRegistered = true;

  window.addEventListener("mousemove", (e) => {
    if (!bbState || bbState.gameOver) return;
    const lx = bbGetLogicalX(e.clientX);
    const ly = bbGetLogicalY(e.clientY);
    bbMouseLogicalX = lx;
    if (!bbState.launched) { bbAim.active = true; bbUpdateAimAngle(lx, ly); }
  });

  const bbTouchTrack = (e) => {
    if (!bbState || bbState.gameOver) return;
    if (e.cancelable) e.preventDefault();
    const lx = bbGetLogicalX(e.touches[0].clientX);
    const ly = bbGetLogicalY(e.touches[0].clientY);
    bbMouseLogicalX = lx;
    if (!bbState.launched) { bbAim.active = true; bbUpdateAimAngle(lx, ly); }
  };
  window.addEventListener("touchstart", bbTouchTrack, { passive: false });
  window.addEventListener("touchmove",  bbTouchTrack, { passive: false });

  window.addEventListener("touchend", () => {
    if (!bbState || bbState.gameOver || bbState.launched) return;
    if (bbAim.active) bbLaunchBall();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") bbKeys.left  = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") bbKeys.right = true;
    if ((e.key === " " || e.key === "Enter") && bbState) {
      e.preventDefault();
      if (!bbState.launched) bbLaunchBall();
      else                   bbTogglePause();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") bbKeys.left  = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") bbKeys.right = false;
  });
}

// ── 벽돌 그리드 생성 ─────────────────────────────────────────
function bbMakeBricks(cfg) {
  const totalGap = (cfg.cols + 1) * BB_BRICK_GAP;
  const brickW   = (BB_W - totalGap) / cfg.cols;
  const brickH   = brickW; // 정사각형
  const bricks   = [];
  for (let r = 0; r < cfg.rows; r += 1) {
    const row = [];
    for (let c = 0; c < cfg.cols; c += 1) {
      const hp = Math.max(1, Math.ceil(cfg.hpMax * (1 - r / cfg.rows)));
      row.push({
        x: BB_BRICK_GAP + c * (brickW + BB_BRICK_GAP),
        y: BB_BRICK_TOP + r * (brickH + BB_BRICK_GAP),
        w: brickW,
        h: brickH,
        hp,
        maxHp:  hp,
        active: true,
      });
    }
    bricks.push(row);
  }
  return bricks;
}

// ── 게임 시작 ─────────────────────────────────────────────────
function startBrickbreakerGame(difficultyKey) {
  const cfg    = BB_CONFIGS[difficultyKey] || BB_CONFIGS.normal;
  const canvas = document.getElementById("brickbreaker-canvas");

  stopBBTimer();
  if (bbState?.animFrameId) cancelAnimationFrame(bbState.animFrameId);

  bbMouseLogicalX = null;
  bbKeys          = { left: false, right: false };
  bbLastTime      = null;
  bbAim           = { active: false, angle: -Math.PI / 2 };

  const bricks = bbMakeBricks(cfg);
  bbState = {
    canvas,
    ctx:           canvas.getContext("2d"),
    difficultyKey,
    cfg,
    ball: {
      x:  BB_W / 2,
      y:  BB_PADDLE_Y - cfg.ballR - 1,
      vx: 200,
      vy: -cfg.speed * 60,
      r:  cfg.ballR,
    },
    paddle: {
      x: (BB_W - cfg.paddleW) / 2,
      y: BB_PADDLE_Y,
      w: cfg.paddleW,
      h: BB_PADDLE_H,
    },
    bricks,
    bricksLeft: bricks.flat().length,
    score:      0,
    bestScore:  getBestRecord("brickbreaker", difficultyKey, null)?.value || 0,
    lives:      cfg.lives,
    level:      1,
    gameOver:   false,
    paused:     false,
    launched:   false,
    animFrameId: null,
    elapsedSeconds: 0,
  };

  // 데스크탑: 클릭으로 발사 (마우스 hover가 조준각 설정)
  canvas.onclick = () => {
    if (bbState && !bbState.launched && !bbState.gameOver) bbLaunchBall();
  };
  canvas.ontouchstart = null;

  const appEl = document.querySelector(".app");
  if (appEl) appEl.classList.add("app--brickbreaker");

  bbRegisterInput();
  bbUpdateHUD();
  bbSetMessage(t("bb.clickToLaunch"));
  showScreen("brickbreakerPlay");
  requestAnimationFrame(bbLoop);
}

// ── 발사 ─────────────────────────────────────────────────────
function bbLaunchBall() {
  if (!bbState || bbState.launched) return;
  const speedMult   = 1 + BB_LEVEL_SPEED_INC * (bbState.level - 1);
  const speed       = bbState.cfg.speed * speedMult * 60;
  bbState.ball.vx   = speed * Math.cos(bbAim.angle);
  bbState.ball.vy   = speed * Math.sin(bbAim.angle);
  bbState.launched  = true;
  bbAim.active      = false;
  bbSetMessage("");
  startBBTimer();
}

// ── 타이머 ────────────────────────────────────────────────────
function startBBTimer() {
  stopBBTimer();
  bbTimerId = setInterval(() => {
    if (bbState && bbState.launched && !bbState.paused && !bbState.gameOver) {
      bbState.elapsedSeconds += 1;
    }
  }, 1000);
}

function stopBBTimer() {
  if (bbTimerId) { clearInterval(bbTimerId); bbTimerId = null; }
}

// ── 일시정지 ──────────────────────────────────────────────────
function bbTogglePause() {
  if (!bbState || !bbState.launched || bbState.gameOver) return;
  bbState.paused = !bbState.paused;
  const btnPause = document.getElementById("btn-bb-pause");
  if (btnPause) btnPause.textContent = bbState.paused ? t("bb.resume") : t("bb.pause");
  bbSetMessage(bbState.paused ? t("bb.paused") : "");
}

// ── 메시지 ────────────────────────────────────────────────────
function bbSetMessage(msg) {
  const el = document.getElementById("brickbreaker-message");
  if (el) el.textContent = msg;
}

// ── HUD ───────────────────────────────────────────────────────
function bbUpdateHUD() {
  if (!bbState) return;
  const scoreEl = document.getElementById("bb-score");
  const bestEl  = document.getElementById("bb-best");
  const livesEl = document.getElementById("bb-lives");
  const levelEl = document.getElementById("bb-level");
  if (scoreEl) scoreEl.textContent = bbState.score;
  if (bestEl)  bestEl.textContent  = Math.max(bbState.score, bbState.bestScore);
  if (livesEl) livesEl.textContent = "♥".repeat(Math.max(0, bbState.lives));
  if (levelEl) levelEl.textContent = bbState.level;
}

// ── 메인 루프 (delta-time 기반) ────────────────────────────────
function bbLoop(timestamp) {
  if (!bbState) return;

  if (bbLastTime !== null && bbState.launched && !bbState.paused && !bbState.gameOver) {
    const dt = Math.min((timestamp - bbLastTime) / 1000, 0.05); // 최대 50ms (≈20fps 하한)
    bbUpdate(dt);
  }
  bbLastTime = timestamp;

  bbDraw();
  bbState.animFrameId = requestAnimationFrame(bbLoop);
}

// ── 업데이트 ──────────────────────────────────────────────────
function bbUpdate(dt) {
  bbMovePaddle(dt);
  bbMoveBall(dt);
}

// ── 패들 이동 ─────────────────────────────────────────────────
function bbMovePaddle(dt) {
  const p = bbState.paddle;

  if (bbMouseLogicalX !== null) {
    p.x = Math.max(0, Math.min(BB_W - p.w, bbMouseLogicalX - p.w / 2));
  }
  if (bbKeys.left)  p.x = Math.max(0,          p.x - BB_PADDLE_SPEED * dt);
  if (bbKeys.right) p.x = Math.min(BB_W - p.w, p.x + BB_PADDLE_SPEED * dt);

  if (!bbState.launched) {
    bbState.ball.x = p.x + p.w / 2;
  }
}

// ── 공 이동 + 충돌 ────────────────────────────────────────────
function bbMoveBall(dt) {
  const b = bbState.ball;
  const p = bbState.paddle;

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // 좌우 벽
  if (b.x - b.r < 0)    { b.x = b.r;          b.vx =  Math.abs(b.vx); }
  if (b.x + b.r > BB_W) { b.x = BB_W - b.r;   b.vx = -Math.abs(b.vx); }
  // 천장
  if (b.y - b.r < 0)    { b.y = b.r;           b.vy =  Math.abs(b.vy); }

  // 패들 충돌
  if (
    b.vy > 0 &&
    b.y + b.r >= p.y &&
    b.y       <= p.y + p.h &&
    b.x + b.r >= p.x &&
    b.x - b.r <= p.x + p.w
  ) {
    const hitRatio = ((b.x - (p.x + p.w / 2)) / (p.w / 2)); // -1 ~ +1
    const angle    = hitRatio * (Math.PI / 3);                // -60° ~ +60°
    const speed    = Math.hypot(b.vx, b.vy);
    b.vx = speed * Math.sin(angle);
    b.vy = -Math.abs(speed * Math.cos(angle));
    b.y  = p.y - b.r - 1;
  }

  // 벽돌 충돌
  bbBrickCollision();

  // 낙사
  if (b.y - b.r > BB_H) bbLoseLife();
}

// ── 벽돌 충돌 (AABB + 겹침 방향) ─────────────────────────────
function bbBrickCollision() {
  const b   = bbState.ball;
  let deflected = false;

  for (const row of bbState.bricks) {
    for (const brick of row) {
      if (!brick.active) continue;
      if (b.x + b.r <= brick.x || b.x - b.r >= brick.x + brick.w) continue;
      if (b.y + b.r <= brick.y || b.y - b.r >= brick.y + brick.h) continue;

      // HP 차감
      brick.hp -= 1;
      if (brick.hp <= 0) {
        brick.active = false;
        bbState.bricksLeft -= 1;
        bbState.score += 10 * bbState.level;
        bbUpdateHUD();
        if (bbState.bricksLeft <= 0) { bbNextLevel(); return; }
      }

      // 반사 (한 프레임에 한 번만)
      if (!deflected) {
        deflected = true;
        const ol = (b.x + b.r) - brick.x;
        const or_ = (brick.x + brick.w) - (b.x - b.r);
        const ot = (b.y + b.r) - brick.y;
        const ob = (brick.y + brick.h) - (b.y - b.r);
        if (Math.min(ol, or_) < Math.min(ot, ob)) b.vx = -b.vx;
        else                                        b.vy = -b.vy;
      }
    }
  }
}

// ── 레벨 클리어 ───────────────────────────────────────────────
function bbNextLevel() {
  const s = bbState;
  s.score += 200 * s.level;
  s.level += 1;

  const speedMult = 1 + BB_LEVEL_SPEED_INC * (s.level - 1);
  const newSpeed  = s.cfg.speed * speedMult * 60;

  s.bricks     = bbMakeBricks(s.cfg);
  s.bricksLeft = s.bricks.flat().length;

  // 공/패들 리셋
  s.paddle.x = (BB_W - s.paddle.w) / 2;
  s.ball.x   = BB_W / 2;
  s.ball.y   = BB_PADDLE_Y - s.ball.r - 1;
  s.ball.vx  = 200;
  s.ball.vy  = -newSpeed;
  s.launched  = false;
  bbMouseLogicalX = null;
  bbAim       = { active: false, angle: -Math.PI / 2 };
  stopBBTimer();
  bbUpdateHUD();

  bbSetMessage(t("bb.levelClear", { n: s.level - 1 }));
  setTimeout(() => {
    if (bbState && !bbState.gameOver) bbSetMessage(t("bb.clickToLaunch"));
  }, 1400);
}

// ── 생명 차감 ─────────────────────────────────────────────────
function bbLoseLife() {
  const s = bbState;
  s.lives -= 1;
  bbUpdateHUD();

  if (s.lives <= 0) { bbEndGame(); return; }

  s.ball.x   = s.paddle.x + s.paddle.w / 2;
  s.ball.y   = BB_PADDLE_Y - s.ball.r - 1;
  s.launched = false;
  bbMouseLogicalX = null;
  bbAim       = { active: false, angle: -Math.PI / 2 };
  stopBBTimer();
  bbSetMessage(t("bb.clickToLaunch"));
}

// ── 게임 종료 ─────────────────────────────────────────────────
function bbEndGame() {
  const s = bbState;
  s.gameOver = true;
  stopBBTimer();
  if (s.animFrameId) { cancelAnimationFrame(s.animFrameId); s.animFrameId = null; }

  lastResultGameId = "brickbreaker";
  lastResultWon    = true;

  const recordResult = tryUpdateRecord({
    gameId:        "brickbreaker",
    difficultyKey: s.difficultyKey,
    digits:        null,
    value:         s.score,
    metric:        "score",
  });

  resultTitle.textContent   = t("brickbreaker.title");
  resultMessage.textContent = t("bb.result.message", { level: s.level, score: s.score });
  const details = [
    t(`difficulty.${s.difficultyKey}`),
    t("bb.result.time", { n: s.elapsedSeconds }),
  ];
  resultDetail.textContent = appendRecordToResult(details, recordResult).join(" · ");

  const appEl = document.querySelector(".app");
  if (appEl) appEl.classList.remove("app--brickbreaker");

  showScreen("result");
}

// ── 게임 종료 시 정리 (홈으로 이동 때 호출) ──────────────────
function exitBrickbreakerGame() {
  stopBBTimer();
  if (bbState?.animFrameId) { cancelAnimationFrame(bbState.animFrameId); }
  const appEl = document.querySelector(".app");
  if (appEl) appEl.classList.remove("app--brickbreaker");
  bbState    = null;
  bbLastTime = null;
}

// ── 그리기 ────────────────────────────────────────────────────
function bbRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else               ctx.rect(x, y, w, h);
  ctx.fill();
}

function bbDraw() {
  if (!bbState) return;
  const { ctx, ball, paddle, bricks, level, paused } = bbState;

  // 배경
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, BB_W, BB_H);

  // 상단 구분선
  ctx.strokeStyle = "#333333";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, BB_BRICK_TOP - 10);
  ctx.lineTo(BB_W, BB_BRICK_TOP - 10);
  ctx.stroke();

  // 벽돌
  for (const row of bricks) {
    for (const brick of row) {
      if (!brick.active) continue;
      const ratio = brick.hp / brick.maxHp;
      ctx.fillStyle = bbTintColor(ratio);
      bbRoundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3);
      if (brick.maxHp > 1) {
        const fontSize = Math.round(brick.w * 0.48);
        const cx = brick.x + brick.w / 2;
        const cy = brick.y + brick.h / 2;
        ctx.font         = `bold ${fontSize}px sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle  = "rgba(0,0,0,0.75)";
        ctx.lineWidth    = Math.max(2, Math.round(fontSize * 0.22));
        ctx.lineJoin     = "round";
        ctx.strokeText(brick.hp, cx, cy);
        ctx.fillStyle    = "#ffffff";
        ctx.fillText(brick.hp, cx, cy);
      }
    }
  }

  // 조준선 (발사 전)
  if (!bbState.launched && bbAim.active) {
    bbDrawAimLine(ctx, ball.x, ball.y, bbAim.angle);
  }

  // 패들
  ctx.fillStyle = "#ffffff";
  bbRoundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 4);

  // 터치 손잡이
  const hW = 40, hH = 12;
  ctx.fillStyle = "#555555";
  bbRoundRect(ctx, paddle.x + (paddle.w - hW) / 2, paddle.y + paddle.h + 5, hW, hH, 6);

  // 공
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#444444";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // 일시정지 오버레이
  if (paused) {
    ctx.fillStyle    = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, BB_W, BB_H);
    ctx.fillStyle    = "#f8fafc";
    ctx.font         = "bold 30px sans-serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t("bb.paused"), BB_W / 2, BB_H / 2);
    ctx.font      = "16px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(t("bb.controls").split("·")[1]?.trim() || "Space", BB_W / 2, BB_H / 2 + 38);
  }
}

function bbDrawAimLine(ctx, startX, startY, angle) {
  const TOTAL = 380;
  const STEP  = 5;

  let x = startX, y = startY;
  let vx = Math.cos(angle), vy = Math.sin(angle);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x, y);

  let dist = 0;
  while (dist < TOTAL) {
    x    += vx * STEP;
    y    += vy * STEP;
    dist += STEP;
    if (x < 0)    { x = -x;            vx = -vx; }
    if (x > BB_W) { x = 2 * BB_W - x;  vx = -vx; }
    if (y < 0) break;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function bbTintColor(ratio) {
  const v = Math.round(60 + ratio * 195);
  return `rgb(${v},${v},${v})`;
}

// ── 난이도 선택 화면 렌더링 ───────────────────────────────────
function renderBrickbreakerDifficultySelect() {
  const optEl = document.getElementById("brickbreaker-difficulty-options");
  if (!optEl) return;
  optEl.innerHTML = [
    { key: "easy",   nameKey: "difficulty.easy",   descKey: "bb.diff.easy" },
    { key: "normal", nameKey: "difficulty.normal", descKey: "bb.diff.normal" },
    { key: "hard",   nameKey: "difficulty.hard",   descKey: "bb.diff.hard" },
  ].map(d => {
    const rec = getRecordMetaLine("brickbreaker", d.key, null);
    return `
      <button type="button" class="option-btn" data-difficulty="${d.key}">
        <span class="label">${t(d.nameKey)}</span>
        <span class="meta-wrap">
          <span class="meta">${t(d.descKey)}</span>
          <span class="record-meta">${rec}</span>
        </span>
      </button>`;
  }).join("");

  optEl.querySelectorAll("[data-difficulty]").forEach(btn => {
    btn.addEventListener("click", () => startBrickbreakerGame(btn.dataset.difficulty));
  });
}
