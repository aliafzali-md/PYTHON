// Every exercise must be solvable, every hint ladder must end in the solution,
// and every starter must fail. A lesson that ships broken teaches the wrong thing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, HELP, TOTAL_EXERCISES } from '../docs/js/curriculum.js';
import { checkExercise } from '../docs/js/checker.js';
import { Interpreter } from '../docs/js/interpreter.js';

const exercises = LEVELS.flatMap((level) =>
  level.exercises.map((exercise) => ({ level, exercise })));

test('every level is well formed', () => {
  const ids = new Set();
  for (const level of LEVELS) {
    assert.ok(level.id && level.title && level.tagline && level.icon, `${level.id} missing fields`);
    assert.ok(!ids.has(level.id), `duplicate level id ${level.id}`);
    ids.add(level.id);
    assert.ok(level.lesson.length >= 1, `${level.id} has no lesson cards`);
    assert.ok(level.exercises.length >= 1, `${level.id} has no exercises`);
    assert.ok(HELP[level.id], `${level.id} has no help reference`);
    for (const q of level.qa) {
      assert.ok(q.options.length >= 2, `${level.id} question needs options`);
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${level.id} answer out of range`);
      assert.ok(q.explain, `${level.id} question needs an explanation`);
    }
  }
});

test('every lesson example prints exactly what the lesson claims', () => {
  for (const level of LEVELS) {
    for (const card of level.lesson) {
      if (!card.code) continue;
      const result = new Interpreter().run(card.code);
      assert.equal(result.ok, true, `${level.id} / ${card.heading}: ${result.error}`);
      assert.equal(
        result.output.trimEnd(),
        (card.output ?? '').trimEnd(),
        `${level.id} / ${card.heading} output mismatch`,
      );
    }
  }
});

test('every solution passes its own tests', () => {
  for (const { level, exercise } of exercises) {
    const result = checkExercise(exercise.solution, exercise.tests);
    const failed = result.results.filter((r) => !r.ok)
      .map((r) => `${r.label}: expected ${r.expected}, got ${r.actual ?? r.note}`);
    assert.equal(
      result.passed, true,
      `${level.id}/${exercise.id} solution failed:\n  ${result.error ?? ''}\n  ${failed.join('\n  ')}`,
    );
  }
});

test('every starter fails, so no exercise is already solved', () => {
  for (const { level, exercise } of exercises) {
    const result = checkExercise(exercise.starter, exercise.tests);
    assert.equal(result.passed, false, `${level.id}/${exercise.id} starter already passes`);
  }
});

test('the final hint is a working solution', () => {
  for (const { level, exercise } of exercises) {
    assert.ok(exercise.hints.length >= 2, `${level.id}/${exercise.id} needs a hint ladder`);
    const lastHint = exercise.hints[exercise.hints.length - 1];
    const result = checkExercise(lastHint, exercise.tests);
    assert.equal(result.passed, true, `${level.id}/${exercise.id} final hint does not pass`);
  }
});

test('exercise ids are unique', () => {
  const ids = exercises.map(({ exercise }) => exercise.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate exercise id');
});

test('the course is the advertised size', () => {
  assert.equal(LEVELS.length, 9);
  assert.equal(TOTAL_EXERCISES, exercises.length);
  assert.ok(TOTAL_EXERCISES >= 24, `expected at least 24 exercises, found ${TOTAL_EXERCISES}`);
});
