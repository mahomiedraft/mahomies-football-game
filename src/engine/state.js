// src/engine/state.js
// Pure game state + helpers. No React, no canvas, no randomness.

export const TEAM_IDS = {
  USER: "USER",
  NPC: "NPC",
};

export function createInitialState(overrides = {}) {
  const base = {
    meta: {
      version: "0.1.0",
    },

    teams: {
      [TEAM_IDS.USER]: {
        id: TEAM_IDS.USER,
        name: "Chefs",
        colors: { primary: "#C8102E", secondary: "#FFFFFF" }, // red/white vibe
        score: 0,
      },
      [TEAM_IDS.NPC]: {
        id: TEAM_IDS.NPC,
        name: "NPC",
        colors: { primary: "#2D6CDF", secondary: "#E6E6E6" }, // placeholder (blue/gray)
        score: 0,
      },
    },

    game: {
      quarter: 1,
      clockSec: 15 * 60, // 15:00
      ballOn: 25, // offense yardline from own goal (0..100). 25 = touchback-ish start
      possession: TEAM_IDS.USER, // who has the ball
      direction: 1, // 1 = moving toward opponent endzone (0->100). Keep simple for now.
      down: 1,
      toGo: 10,
      goalToGo: false,

      // Optional: later we can add timeouts, kickoff state, etc.
      isOver: false,
    },

    // Memory used for chaos triggers & narration
    memory: {
      lastPlay: null, // { type, yards, ... }
      sackStreak: 0,  // increments on sacks, resets otherwise
      lastOutcomeD6: null,
    },

    // Play-by-play log entries (newest first)
    log: [],

    ...overrides,
  };

  return base;
}

/**
 * Helpers (pure, deterministic)
 */

export function cloneState(state) {
  // Structured clone without depending on browser-only structuredClone
  return JSON.parse(JSON.stringify(state));
}

export function currentOffense(state) {
  return state.game.possession;
}

export function currentDefense(state) {
  return state.game.possession === TEAM_IDS.USER ? TEAM_IDS.NPC : TEAM_IDS.USER;
}

export function setPossession(state, teamId) {
  const s = cloneState(state);
  s.game.possession = teamId;
  s.game.down = 1;
  s.game.toGo = 10;
  s.game.goalToGo = isGoalToGo(s.game.ballOn);
  // reset sack streak for new possession
  s.memory.sackStreak = 0;
  return s;
}

export function flipPossession(state, { spotBallOn = null } = {}) {
  const s = cloneState(state);

  // Flip field perspective by mirroring yardline:
  // If offense had ballOn = 30 (own 30), defense takes over at their own 70? (mirror)
  // Standard mirror: newBallOn = 100 - oldBallOn
  const mirrored = 100 - s.game.ballOn;
  s.game.ballOn = clampBallOn(spotBallOn ?? mirrored);

  s.game.possession = currentDefense(s);
  s.game.down = 1;
  s.game.toGo = 10;
  s.game.goalToGo = isGoalToGo(s.game.ballOn);

  s.memory.sackStreak = 0;
  s.memory.lastPlay = { type: "POSSESSION_CHANGE", yards: 0 };
  s.memory.lastOutcomeD6 = null;

  return s;
}

export function applyYards(state, yards) {
  const s = cloneState(state);
  s.game.ballOn = clampBallOn(s.game.ballOn + yards);
  s.game.goalToGo = isGoalToGo(s.game.ballOn);
  return s;
}

export function scorePoints(state, teamId, points) {
  const s = cloneState(state);
  s.teams[teamId].score += points;
  return s;
}

export function nextDown(state, { gainedYards = 0 } = {}) {
  const s = cloneState(state);

  // Update toGo
  const newToGo = Math.max(0, s.game.toGo - gainedYards);

  if (newToGo <= 0) {
    // First down achieved (unless goal-to-go logic later says otherwise)
    s.game.down = 1;
    s.game.toGo = 10;
  } else {
    s.game.down = Math.min(4, s.game.down + 1);
    s.game.toGo = newToGo;
  }

  // Goal-to-go if inside the 10 (simple rule for now)
  s.game.goalToGo = isGoalToGo(s.game.ballOn);
  if (s.game.goalToGo) {
    // In goal-to-go, toGo becomes distance to goal line (100)
    s.game.toGo = Math.max(1, 100 - s.game.ballOn);
  }

  return s;
}

export function setClock(state, clockSec) {
  const s = cloneState(state);
  s.game.clockSec = Math.max(0, Math.floor(clockSec));
  return s;
}

export function runClock(state, seconds) {
  const s = cloneState(state);
  const newClock = Math.max(0, s.game.clockSec - Math.max(0, Math.floor(seconds)));
  s.game.clockSec = newClock;

  if (newClock === 0) {
    // end of quarter / game progression will be handled later in engine logic
    // for now just clamp to 0
  }

  return s;
}

export function addLog(state, entry) {
  const s = cloneState(state);
  const normalized = {
    id: cryptoSafeId(),
    ts: Date.now(),
    ...entry,
  };
  s.log = [normalized, ...s.log];
  return s;
}

/**
 * Small utilities
 */

export function clampBallOn(ballOn) {
  // 0 = own goal line, 100 = opponent goal line
  return Math.max(0, Math.min(100, Math.floor(ballOn)));
}

export function isGoalToGo(ballOn) {
  // Simple: inside opponent 10-yard line (ballOn >= 90)
  return ballOn >= 90;
}

function cryptoSafeId() {
  // Avoid crashing if crypto isn't available (some environments)
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

