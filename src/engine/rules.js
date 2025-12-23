export const D6_OUTCOME = {
  1: { key: "SACK", label: "Sack" },
  2: { key: "STUFFED", label: "Stuffed Run" },
  3: { key: "SHORT_GAIN", label: "Short Gain" },
  4: { key: "CHAIN_MOVER", label: "First-Down-Type Play" },
  5: { key: "BIG_PLAY", label: "Big Play" },
  6: { key: "TOUCHDOWN", label: "Touchdown" },
};

export function yardsFromD6D10(d6, d10) {
  if (d6 === 3) return 3 + Math.floor(d10 / 5);     // 3–4
  if (d6 === 4) return 10 + Math.floor(d10 / 2);    // 11–15
  if (d6 === 5) return 20 + d10;                    // 21–30
  return 0;
}

export function sackYards(ballOn) {
  if (ballOn <= 10) return -3;
  if (ballOn <= 25) return -5;
  if (ballOn <= 50) return -6;
  return -7;
}

export function isLateHalf(game) {
  return (game.quarter === 2 || game.quarter === 4) && game.clockSec <= 120;
}

export function isOwnTerritory(ballOn) {
  return ballOn < 50;
}

export function isGoalLineDanger(ballOn) {
  return ballOn <= 3;
}

export function isTrailingLate(state) {
  const { game, teams } = state;
  if (game.quarter !== 4 || game.clockSec > 300) return false;
  const off = game.possession;
  const def = off === "USER" ? "NPC" : "USER";
  return teams[off].score < teams[def].score;
}

export function isTurnoverProne(game) {
  return game.ballOn <= 20;
}

export function shouldTriggerChaos(state, playResult) {
  const { game, memory } = state;

  if (playResult.key === "SACK") {
    if (isOwnTerritory(game.ballOn)) return true;
    if (isGoalLineDanger(game.ballOn)) return true;
    if (memory.sackStreak >= 1) return true;
    if (isLateHalf(game)) return true;
    if (isTrailingLate(state)) return true;
  }

  if (isTurnoverProne(game)) return true;

  return false;
}

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

export function capByFieldSpace(ballOn, yards) {
  const maxForward = 100 - ballOn;
  if (yards > maxForward) return maxForward;
  const maxBackward = -ballOn;
  if (yards < maxBackward) return maxBackward;
  return yards;
}
