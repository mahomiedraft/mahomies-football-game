import {
  D6_OUTCOME,
  yardsFromD6D10,
  sackYards,
  shouldTriggerChaos,
  chaosEffectFromD20,
  capByFieldSpace,
} from "./rules";

import { cloneState, applyYards, nextDown, flipPossession, scorePoints, addLog } from "./state";

export function resolvePlay(state, { d6, d10 = null, d20 = null }) {
  let s = cloneState(state);
  const events = [];

  const outcome = D6_OUTCOME[d6];
  if (!outcome) throw new Error("Invalid D6 value");

  if (outcome.key === "TOUCHDOWN") {
    s = scorePoints(s, s.game.possession, 6);
    events.push({ type: "TOUCHDOWN", by: s.game.possession });
    s = addLog(s, { text: "TOUCHDOWN! Dice says six. No arguments." });
    s = flipPossession(s, { spotBallOn: 25 });
    return { newState: s, events };
  }

  let yards = 0;

  if (outcome.key === "SACK") {
    yards = sackYards(s.game.ballOn);
    s.memory.sackStreak += 1;
    events.push({ type: "SACK", yards });
    s = addLog(s, { text: `QB sacked for ${yards} yards.` });
  }

  if (outcome.key === "STUFFED") {
    yards = 0;
    s.memory.sackStreak = 0;
    events.push({ type: "STUFFED" });
    s = addLog(s, { text: "Stuffed at the line. No gain." });
  }

  if (["SHORT_GAIN", "CHAIN_MOVER", "BIG_PLAY"].includes(outcome.key)) {
    if (d10 == null) throw new Error("D10 required for this play");
    yards = yardsFromD6D10(d6, d10);
    yards = capByFieldSpace(s.game.ballOn, yards);
    s.memory.sackStreak = 0;

    events.push({ type: outcome.key, yards });
    s = addLog(s, { text: `${outcome.label} for ${yards} yards.` });
  }

  s = applyYards(s, yards);

  const chaosTriggered = shouldTriggerChaos(s, outcome);

  if (chaosTriggered && d20 == null) {
    events.push({ type: "CHAOS_REQUIRED" });
    return { newState: s, events };
  }

  if (chaosTriggered && d20 != null) {
    const chaos = chaosEffectFromD20(d20);
    events.push({ type: "CHAOS", result: chaos.key });
    s = addLog(s, { text: `Chaos roll: ${chaos.label}` });

    if (chaos.key === "TURNOVER") {
      events.push({ type: "TURNOVER" });
      s = addLog(s, { text: "Turnover! Defense takes over." });
      s = flipPossession(s);
      return { newState: s, events };
    }

    if (chaos.key === "PENALTY") {
      s = applyYards(s, -10);
      s = addLog(s, { text: "Holding penalty. Ten yards back." });
    }

    if (chaos.key === "DEF_MISTAKE") {
      const bonus = capByFieldSpace(s.game.ballOn, 10);
      s = applyYards(s, bonus);
      s = addLog(s, { text: "Defensive mistake! Extra yards gained." });
    }
  }

  if (s.game.ballOn >= 100) {
    s = scorePoints(s, s.game.possession, 6);
    events.push({ type: "TOUCHDOWN", by: s.game.possession });
    s = addLog(s, { text: "Touchdown! The drive finishes it." });
    s = flipPossession(s, { spotBallOn: 25 });
    return { newState: s, events };
  }

  s = nextDown(s, { gainedYards: yards });

  // NOTE: This is a simplified “4th-down logic” placeholder.
  // We’ll add punt/FG/go-for-it decisions soon.
  if (s.game.down === 4 && s.game.toGo > 0) {
    events.push({ type: "TURNOVER_ON_DOWNS" });
    s = addLog(s, { text: "Turnover on downs." });
    s = flipPossession(s);
    return { newState: s, events };
  }

  return { newState: s, events };
}
