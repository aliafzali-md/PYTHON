// Progress lives only in this browser. Nothing is ever sent anywhere.
//
// Every access is wrapped: Safari throws on localStorage in private mode and
// when site data is blocked, and the game has to keep working regardless.

const KEY = 'pyquest.progress.v1';

const EMPTY = {
  version: 1,
  xp: 0,
  streakCount: 0,
  streakDay: null,
  levels: {},
  drafts: {},
};

let cache = null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...structuredClone(EMPTY), ...JSON.parse(raw) } : structuredClone(EMPTY);
  } catch {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Out of quota or storage blocked: the session still works, it just will
    // not survive a reload. Failing loudly here would help nobody.
  }
}

export function levelState(levelId) {
  const data = load();
  if (!data.levels[levelId]) {
    data.levels[levelId] = { exercises: {}, qaAnswered: {}, completed: false };
  }
  const state = data.levels[levelId];
  state.exercises = state.exercises || {};
  state.qaAnswered = state.qaAnswered || {};
  return state;
}

export function exerciseState(levelId, exerciseId) {
  const level = levelState(levelId);
  if (!level.exercises[exerciseId]) {
    level.exercises[exerciseId] = { solved: false, attempts: 0, hintsUsed: 0 };
  }
  return level.exercises[exerciseId];
}

/** Award XP once per exercise, reduced by hints but never below a floor. */
export function recordSolved(levelId, exerciseId) {
  const data = load();
  const state = exerciseState(levelId, exerciseId);
  if (state.solved) return 0;
  state.solved = true;
  const earned = Math.max(4, 10 - state.hintsUsed * 2);
  data.xp += earned;
  touchStreak();
  save();
  return earned;
}

export function recordAttempt(levelId, exerciseId) {
  exerciseState(levelId, exerciseId).attempts += 1;
  save();
}

export function recordHint(levelId, exerciseId) {
  const state = exerciseState(levelId, exerciseId);
  state.hintsUsed += 1;
  save();
  return state.hintsUsed;
}

export function recordQa(levelId, index, correct) {
  const data = load();
  const level = levelState(levelId);
  if (level.qaAnswered[index] === undefined) {
    level.qaAnswered[index] = correct;
    if (correct) data.xp += 5;
    save();
  }
}

export function completeLevel(levelId) {
  const data = load();
  const level = levelState(levelId);
  if (level.completed) return 0;
  level.completed = true;
  data.xp += 20;
  touchStreak();
  save();
  return 20;
}

function touchStreak() {
  const data = load();
  const day = today();
  if (data.streakDay === day) return;
  const gap = data.streakDay ? daysBetween(data.streakDay, day) : null;
  data.streakCount = gap === 1 ? data.streakCount + 1 : 1;
  data.streakDay = day;
}

/** Keep unfinished code so closing the app does not lose it. */
export function saveDraft(exerciseId, code) {
  const data = load();
  data.drafts[exerciseId] = code;
  save();
}

export function getDraft(exerciseId) {
  return load().drafts[exerciseId];
}

export function clearDraft(exerciseId) {
  delete load().drafts[exerciseId];
  save();
}

export function resetAll() {
  cache = structuredClone(EMPTY);
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clean up if storage was never available.
  }
}
