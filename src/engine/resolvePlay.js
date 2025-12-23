// src/engine/resolvePlay.js
// Applies dice to state using rules. Returns newState + events.
// Still pure logic: no React, no canvas.

import {
  D6_OUTCOME,
  yardsFromD6D10,
  sackYards,
  shouldTriggerChaos,
  chaosEffectFromD20,
  capByFieldSpace,
} from "./rules";

import {
  cloneState,
  applyYards,
  nextDown,
  flipPossession,
  scorePoints,
  addLog,
} from "./state";

export function resolvePlay(state, { d6, d10 = null, d20 = null }) {
  let s = cloneState(state);
  const events = [];

  const outcome = D6_OUTCOME[d6];
  if (!outcome) {
    throw new Error("Invalid D6 value");
  }

  // --- TOUCHDOWN OVERRIDE ---
  if (outcome.key === "TOUCHDOWN") {
    s = scorePoints(s, s.game.possession, 6);
    events.push({ type: "TOUCHDOWN", by: s.game.possession });

    s = addLog(s, {
      text: "TOUCHDOWN! Dice says six. No arguments.",
    });

    // Reset possession (kickoff logic simplified)
    s = flipPossession(s, { spotBallOn: 25 });
    return { newState: s, events };
  }

  let yards = 0;

  // --- SACK ---
  if (outcome.key === "SACK") {
    yards = sackYards(s.game.ballOn);
    s.memory.sackStreak += 1;
    events.push({ type: "SACK", yards });

    s = addLog(s, {
      text: `QB sacked for ${yards} yards.`,
    });
  }

  // --- STUFFED ---
  if (outcome.key === "STUFFED") {
    yards = 0;
    s.memory.sackStreak = 0;
    events.push({ type: "STUFFED" });

    s = addLog(s, {
      text: "Stuffed at the line. No gain.",
    });
  }

  // --- YARDAGE PLAYS ---
  if (["SHORT_GAIN", "CHAIN_MOVER", "BIG_PLAY"].includes(outcome.key)) {
    if (d10 == null) {
      throw new Error("D10 required for this play");
    }

    yards = yardsFromD6D10(d6, d10);
    yards = capByFieldSpace(s.game.ballOn, yards);
    s.memory.sackStreak = 0;

    events.push({ type: outcome.key, yards });

    s = addLog(s, {
      text: `${outcome.label} for ${yards} yards.`,
    });
  }

  // Apply yardage to field
  s = applyYards(s, yards);

  // --- CHAOS CHECK ---
  const chaosTriggered = shouldTriggerChaos(s, outcome);

  if (chaosTriggered && d20 == null) {
    // Tell UI to ask for D20
    events.push({ type: "CHAOS_REQUIRED" });
    return { newState: s, events };
  }

  // --- CHAOS RESOLUTION ---
  if (chaosTriggered && d20 != null) {
    const chaos = chaosEffectFromD20(d20);
    events.push({ type: "CHAOS", result: chaos.key });

    s = addLog(s, {
      text: `Chaos roll: ${chaos.label}`,
    });

    // Apply chaos effects
    if (chaos.key === "TURNOVER") {
      events.push({ type: "TURNOVER" });
      s = addLog(s, { text: "Turnover! Defense takes over." });
      s = flipPossession(s);
      return { newState: s, events };
    }

    if (chaos.key === "PENALTY") {
      // Simple holding: -10 yards
      s = applyYards(s, -10);
      s = addLog(s, { text: "Holding penalty. Ten yards back." });
    }

    if (chaos.key === "DEF_MISTAKE") {
      // Bonus yards, capped
      const bonus = capByFieldSpace(s.game.ballOn, 10);
      s = applyYards(s, bonus);
      s = addLog(s, { text: "Defensive mistake! Extra yards gained." });
    }

    // Momentum / clean / hard hit do not alter state further
  }

  // --- CHECK FOR TD BY YARDAGE ---
  if (s.game.ballOn >= 100) {
    s = scorePoints(s, s.game.possession, 6);
    events.push({ type: "TOUCHDOWN", by: s.game.possession });

    s = addLog(s, {
      text: "Touchdown! The drive finishes it.",
    });

    s = flipPossession(s, { spotBallOn: 25 });
    return { newState: s, events };
  }

  // --- DOWN & DISTANCE ---
  s = nextDown(s, { gainedYards: yards });

  // --- TURNOVER ON DOWNS ---
  if (s.game.down === 4 && s.game.toGo > 0) {
    events.push({ type: "TURNOVER_ON_DOWNS" });
    s = addLog(s, { text: "Turnover on downs." });
    s = flipPossession(s);
    return { newState: s, events };
  }

  return { newState: s, events };
}

