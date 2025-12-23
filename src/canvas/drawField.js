// src/canvas/drawField.js
// Draws a pixel-style stadium + field. No game logic.

export function drawStadium(ctx, canvas, options = {}) {
  const {
    userTeamName = "CHEFS",
    npcTeamName = "NPC",
    userColors = { primary: "#C8102E", secondary: "#FFFFFF" },
    npcColors = { primary: "#2D6CDF", secondary: "#E6E6E6" },
    ballOn = 25, // 0..100 (offense yardline)
  } = options;

  const W = canvas.width;
  const H = canvas.height;

  // Crisp pixel scaling
  ctx.imageSmoothingEnabled = false;

  // --- Background / sky ---
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, W, H);

  // --- Stadium stands area ---
  const standsTop = 0;
  const standsH = Math.floor(H * 0.28);
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, standsTop, W, standsH);

  // Crowd pixels (procedural dots)
  drawCrowd(ctx, 0, standsTop, W, standsH);

  // --- Field geometry ---
  const fieldPadX = Math.floor(W * 0.07);
  const fieldPadY = Math.floor(H * 0.06);

  const fieldX = fieldPadX;
  const fieldY = standsH + fieldPadY;
  const fieldW = W - fieldPadX * 2;
  const fieldH = H - standsH - fieldPadY * 2;

  // Outer border
  ctx.fillStyle = "#0f3d1e";
  ctx.fillRect(fieldX - 3, fieldY - 3, fieldW + 6, fieldH + 6);

  // Grass
  ctx.fillStyle = "#136b2f";
  ctx.fillRect(fieldX, fieldY, fieldW, fieldH);

  // Subtle stripes
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    const stripeW = Math.ceil(fieldW / 12);
    ctx.fillRect(fieldX + i * stripeW, fieldY, stripeW, fieldH);
  }

  // End zones (left = offense start side, right = opponent end)
  const endZoneW = Math.floor(fieldW * 0.09);
  drawEndZone(ctx, fieldX, fieldY, endZoneW, fieldH, userColors.primary, userTeamName);
  drawEndZone(
    ctx,
    fieldX + fieldW - endZoneW,
    fieldY,
    endZoneW,
    fieldH,
    npcColors.primary,
    npcTeamName
  );

  // Yard lines + hashes
  drawFieldLines(ctx, fieldX + endZoneW, fieldY, fieldW - endZoneW * 2, fieldH);

  // Goal posts
  drawGoalPost(ctx, fieldX + 6, fieldY, fieldH);
  drawGoalPost(ctx, fieldX + fieldW - 6, fieldY, fieldH);

  // Ball marker + LOS indicator based on ballOn (0..100)
  drawBallMarker(ctx, fieldX, fieldY, fieldW, fieldH, ballOn);

  // Overlay mini-scoreboard label
  drawTopOverlay(ctx, W, standsH, userTeamName, npcTeamName);
}

function drawCrowd(ctx, x, y, w, h) {
  // dot size is 1px; keeps it pixelly
  for (let row = 0; row < h; row += 2) {
    for (let col = 0; col < w; col += 2) {
      const r = Math.random();
      if (r < 0.55) continue;
      // Random crowd colors
      let color = "#9CA3AF";
      if (r > 0.92) color = "#F59E0B";
      else if (r > 0.86) color = "#60A5FA";
      else if (r > 0.80) color = "#F87171";
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + row, 1, 1);
    }
  }

  // rail
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(x, y + h - 6, w, 6);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y + h - 6, w, 1);
}

function drawEndZone(ctx, x, y, w, h, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // End zone text (simple block letters)
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const text = (label || "").toUpperCase().slice(0, 10);
  drawBlockText(ctx, text, x + 6, y + Math.floor(h / 2) - 6, 2);
}

function drawFieldLines(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(255,255,255,0.75)";

  // Main yard lines (10 lines across playable area)
  const lines = 10;
  for (let i = 0; i <= lines; i++) {
    const lx = x + Math.floor((w * i) / lines);
    ctx.fillRect(lx, y, 1, h);

    // Hash marks
    const hashYTop = y + Math.floor(h * 0.38);
    const hashYBot = y + Math.floor(h * 0.62);
    for (let hy = hashYTop; hy <= hashYBot; hy += Math.floor(h * 0.24)) {
      ctx.fillRect(lx - 2, hy, 5, 1);
    }
  }

  // Sidelines
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);

  // Numbers (approx) at 10/20/30/40
  const nums = [10, 20, 30, 40];
  nums.forEach((n, idx) => {
    const pos = idx + 1; // 1..4
    const nx = x + Math.floor((w * pos) / 5) - 6;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    drawBlockText(ctx, String(n), nx, y + 6, 2);
    drawBlockText(ctx, String(n), nx, y + h - 14, 2);
  });
}

function drawGoalPost(ctx, x, y, h) {
  ctx.fillStyle = "#FDE047"; // yellow
  const midY = y + Math.floor(h / 2);
  // upright
  ctx.fillRect(x - 1, midY - 16, 2, 32);
  // crossbar
  ctx.fillRect(x - 10, midY - 16, 20, 2);
  // prongs
  ctx.fillRect(x - 10, midY - 28, 2, 12);
  ctx.fillRect(x + 8, midY - 28, 2, 12);
}

function drawBallMarker(ctx, fieldX, fieldY, fieldW, fieldH, ballOn) {
  // ballOn: 0..100 maps left->right
  const clamped = Math.max(0, Math.min(100, ballOn));
  const endZoneW = Math.floor(fieldW * 0.09);
  const playableX = fieldX + endZoneW;
  const playableW = fieldW - endZoneW * 2;

  const x = playableX + Math.floor((playableW * clamped) / 100);
  const y = fieldY + Math.floor(fieldH / 2);

  // line of scrimmage
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x, fieldY, 1, fieldH);

  // ball (tiny brown pixel oval)
  ctx.fillStyle = "#7c3f1d";
  ctx.fillRect(x - 2, y - 1, 4, 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x - 1, y - 1, 1, 2);
}

function drawTopOverlay(ctx, W, standsH, leftLabel, rightLabel) {
  const barH = 18;
  const y = standsH - barH;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, y, W, barH);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillRect(0, y, W, 1);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  drawBlockText(ctx, `${leftLabel} vs ${rightLabel}`, 10, y + 5, 2);
}

// Tiny block text (pixel-ish). Only supports A-Z 0-9 space and a few symbols.
function drawBlockText(ctx, text, x, y, scale = 2) {
  const glyphs = getGlyphs();
  const s = scale;

  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = glyphs[ch] || glyphs["?"];
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] === "1") {
          ctx.fillRect(cx + c * s, y + r * s, s, s);
        }
      }
    }
    cx += (g[0].length + 1) * s;
  }
}

function getGlyphs() {
  // 5x5 font
  return {
    "A": ["01110","10001","11111","10001","10001"],
    "B": ["11110","10001","11110","10001","11110"],
    "C": ["01111","10000","10000","10000","01111"],
    "D": ["11110","10001","10001","10001","11110"],
    "E": ["11111","10000","11110","10000","11111"],
    "F": ["11111","10000","11110","10000","10000"],
    "G": ["01111","10000","10111","10001","01110"],
    "H": ["10001","10001","11111","10001","10001"],
    "I": ["11111","00100","00100","00100","11111"],
    "J": ["11111","00010","00010","10010","01100"],
    "K": ["10001","10010","11100","10010","10001"],
    "L": ["10000","10000","10000","10000","11111"],
    "M": ["10001","11011","10101","10001","10001"],
    "N": ["10001","11001","10101","10011","10001"],
    "O": ["01110","10001","10001","10001","01110"],
    "P": ["11110","10001","11110","10000","10000"],
    "Q": ["01110","10001","10001","10011","01111"],
    "R": ["11110","10001","11110","10010","10001"],
    "S": ["01111","10000","01110","00001","11110"],
    "T": ["11111","00100","00100","00100","00100"],
    "U": ["10001","10001","10001","10001","01110"],
    "V": ["10001","10001","10001","01010","00100"],
    "W": ["10001","10001","10101","11011","10001"],
    "X": ["10001","01010","00100","01010","10001"],
    "Y": ["10001","01010","00100","00100","00100"],
    "Z": ["11111","00010","00100","01000","11111"],
    "0": ["01110","10011","10101","11001","01110"],
    "1": ["00100","01100","00100","00100","01110"],
    "2": ["01110","10001","00010","00100","11111"],
    "3": ["11110","00001","01110","00001","11110"],
    "4": ["10010","10010","11111","00010","00010"],
    "5": ["11111","10000","11110","00001","11110"],
    "6": ["01110","10000","11110","10001","01110"],
    "7": ["11111","00010","00100","01000","01000"],
    "8": ["01110","10001","01110","10001","01110"],
    "9": ["01110","10001","01111","00001","01110"],
    " ": ["00000","00000","00000","00000","00000"],
    "V": ["10001","10001","10001","01010","00100"],
    "S": ["01111","10000","01110","00001","11110"],
    "-": ["00000","00000","11111","00000","00000"],
    "?": ["01110","10001","00010","00000","00010"],
  };
}

