export const TEAM_IDS = { USER: "USER", NPC: "NPC" };

export function createInitialState(overrides = {}) {
  return {
    teams: {
      USER: { id: "USER", name: "Chefs", colors: { primary: "#C8102E", secondary: "#FFFFFF" }, score: 0 },
      NPC: { id: "NPC", name: "NPC", colors: { primary: "#2D6CDF", secondary: "#E6E6E6" }, score: 0 },
    },
    game: {
      quarter: 1,
      clockSec: 15 * 60,
      ballOn: 25,         // 0..100
      possession: "USER", // USER has ball
      down: 1,
      toGo: 10,
      goalToGo: false,
      isOver: false,
    },
    memory: {
      lastPlay: null,
      sackStreak: 0,
      lastOutcomeD6: null,
    },
    log: [],
    ...overrides,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function currentDefense(state) {
  return state.game.possession === "USER" ? "NPC" : "USER";
}

export function clampBallOn(ballOn) {
  return Math.max(0, Math.min(100, Math.floor(ballOn)));
}

export function isGoalToGo(ballOn) {
  return ballOn >= 90;
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

  const newToGo = Math.max(0, s.game.toGo - gainedYards);

  if (newToGo <= 0) {
    s.game.down = 1;
    s.game.toGo = 10;
  } else {
    s.game.down = Math.min(4, s.game.down + 1);
    s.game.toGo = newToGo;
  }

  s.game.goalToGo = isGoalToGo(s.game.ballOn);
  if (s.game.goalToGo) {
    s.game.toGo = Math.max(1, 100 - s.game.ballOn);
  }

  return s;
}

export function flipPossession(state, { spotBallOn = null } = {}) {
  const s = cloneState(state);

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

function cryptoSafeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function addLog(state, entry) {
  const s = cloneState(state);
  const normalized = { id: cryptoSafeId(), ts: Date.now(), ...entry };
  s.log = [normalized, ...s.log];
  return s;
}
