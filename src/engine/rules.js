// src/engine/rules.js
// Your OFFICIAL rules: D6 > D10 > D20.
// Pure logic. No React, no canvas, no randomness.

export const D6_OUTCOME = {
  1: { key: "SACK", label: "Sack", yards: null },
  2: { key: "STUFFED", label: "Stuffed Run", yards: 0 }, // -1..0 in narrative; we keep 0 here for now
  3: { key: "SHORT_GAIN", label: "Short Gain", yards: "D10" },
  4: { key: "CHAIN_MOVER", label: "First-Down-Type Play", yards: "D10" },
  5: { key: "BIG_PLAY", label: "Big Play", yards: "D10" },
  6: { key: "TOUCHDOWN", label: "Touchdown", yards: "TD" },
};

// D10 yardage rules exactly from your doc
export function yardsFromD6D10(d6, d10) {
  if (d6 === 3) {
    // 3 + (D10 ÷ 5) => 3–4
    return 3 + Math.floor(d10 / 5);
  }
  if (d6 === 4) {
    // 10 + (D10 ÷ 2) => 11–15
    return 10 + Math.floor(d10 / 2);
  }
  if (d6 === 5) {
    // 20 + D10 => 21–30
    return 20 + d10;
  }
  return 0;
}

// Simple sack yardage (you can tweak later)
// Keeping it deterministic based on field position to avoid extra dice.
export function sackYards(ballOn) {
  // deeper in own territory tends to be slightly bigger losses
  if (ballOn <= 10) return -3;
  if (ballOn <= 25) return -5;
  if (ballOn <= 50) return -6;
  return -7;
}

// Chaos triggers from your doc (implemented as checkers)
export function isLateHalf(game) {
  // last 2 minutes of Q2 or Q4
  return (game.quarter === 2 || game.quarter === 4) && game.clockSec <= 120;
}

export function isOwnTerritory(ballOn) {
  // "own territory" = ball on your side of the 50
  return ballOn < 50;
}

export function isGoalLineDanger(ballOn) {
  // "at goal line" danger: pinned near your own end
  return ballOn <= 3;
}

export function isTrailingLate(state) {
  // "while trailing late": Q4 inside 5 minutes and behind
  const { game, teams } = state;
  if (game.quarter !== 4 || game.clockSec > 300) return false;
  const off = game.possession;
  const def = off === "USER" ? "NPC" : "USER";
  return teams[off].score < teams[def].score;
}

// Turnover-prone situations (definition we choose, consistent & simple)
export function isTurnoverProne(game) {
  // Backed up inside own 20 OR extremely close game late (handled elsewhere)
  return game.ballOn <= 20;
}

export function shouldTriggerChaos(state, playResult) {
  const { game, memory } = state;

  // Only trigger chaos on specific danger conditions
  if (playResult.key === "SACK") {
    if (isOwnTerritory(game.ballOn)) return true;
    if (isGoalLineDanger(game.ballOn)) return true;
    if (memory.sackStreak >= 1) return true; // back-to-back sacks
    if (isLateHalf(game)) return true;
    if (isTrailingLate(state)) return true;
  }

  // 4th-down desperation: going for it on 4th (we'll tag later)
  if (playResult.key === "FOURTH_DOWN_DESPERATION") return true;

  // Turnover-prone situation:
  if (isTurnoverProne(game)) return true;

  return false;
}

// D20 chaos table from your doc (no TD creation)
export function chaosEffectFromD20(d20) {
  if (d20 === 1) return { key: "TURNOVER", label: "Turnover (fumble/INT)" };
  if (d20 === 2 || d20 === 3) return { key: "NEAR_TURNOVER", label: "Near turnover (offense recovers)" };
  if (d20 === 4 || d20 === 5) return { key: "PENALTY", label: "Penalty (usually holding)" };
  if (d20 >= 6 && d20 <= 8) return { key: "HARD_HIT", label: "No chaos (hard hit only)" };
  if (d20 >= 9 && d20 <= 15) return { key: "CLEAN", label: "Clean play" };
  if (d20 >= 16 && d20 <= 18) return { key: "MOMENTUM", label: "Momentum swing" };
  if (d20 === 19) return { key: "DEF_MISTAKE", label: "Defensive mistake / bonus" };
  if (d20 === 20) return { key: "ABSOLUTE_CHAOS", label: "Absolute chaos (huge swing)" };
  return { key: "CLEAN", label: "Clean play" };
}

// Caps yardage by remaining field space (0..100 scale)
export function capByFieldSpace(ballOn, yards) {
  const maxForward = 100 - ballOn;
  if (yards > maxForward) return maxForward;
  // allow negative yardage freely, but not beyond own goal line
  const maxBackward = -ballOn;
  if (yards < maxBackward) return maxBackward;
  return yards;
}

