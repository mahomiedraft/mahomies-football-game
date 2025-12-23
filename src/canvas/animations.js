// src/canvas/animations.js
// Pure pixel animations. No game logic, no state mutations.

export function playAnimation(ctx, canvas, event) {
  if (!ctx || !event) return;

  switch (event.type) {
    case "TOUCHDOWN":
      touchdownAnimation(ctx, canvas);
      break;

    case "SACK":
      sackAnimation(ctx, canvas);
      break;

    case "STUFFED":
      stuffedAnimation(ctx, canvas);
      break;

    case "BIG_PLAY":
      bigPlayAnimation(ctx, canvas);
      break;

    case "TURNOVER":
      turnoverAnimation(ctx, canvas);
      break;

    case "CHAOS":
      chaosShake(ctx, canvas);
      break;

    default:
      // no animation
      break;
  }
}

/* =========================
   INDIVIDUAL ANIMATIONS
   ========================= */

function touchdownAnimation(ctx, canvas) {
  const { width, height } = canvas;
  flashOverlay(ctx, width, height, "#ffffff", 4);
  banner(ctx, width, height, "TOUCHDOWN", "#fde047");
}

function sackAnimation(ctx, canvas) {
  const { width, height } = canvas;
  shake(ctx, width, height, 6);
  banner(ctx, width, height, "SACK", "#f87171");
}

function stuffedAnimation(ctx, canvas) {
  const { width, height } = canvas;
  banner(ctx, width, height, "STUFFED", "#fb7185");
}

function bigPlayAnimation(ctx, canvas) {
  const { width, height } = canvas;
  banner(ctx, width, height, "BIG PLAY", "#60a5fa");
}

function turnoverAnimation(ctx, canvas) {
  const { width, height } = canvas;
  shake(ctx, width, height, 8);
  banner(ctx, width, height, "TURNOVER", "#a855f7");
}

function chaosShake(ctx, canvas) {
  const { width, height } = canvas;
  shake(ctx, width, height, 10);
}

/* =========================
   EFFECT HELPERS
   ========================= */

function banner(ctx, W, H, text, color) {
  ctx.save();

  const boxW = W * 0.7;
  const boxH = 40;
  const x = (W - boxW) / 2;
  const y = H * 0.35;

  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x, y, boxW, boxH);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, boxW, boxH);

  ctx.fillStyle = color;
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, y + boxH / 2);

  ctx.restore();
}

function shake(ctx, W, H, intensity = 5) {
  const dx = (Math.random() - 0.5) * intensity;
  const dy = (Math.random() - 0.5) * intensity;
  ctx.translate(dx, dy);

  setTimeout(() => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, 80);
}

function flashOverlay(ctx, W, H, color, flashes = 3) {
  let count = 0;
  const interval = setInterval(() => {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    count++;
    if (count >= flashes) clearInterval(interval);
  }, 80);
}

