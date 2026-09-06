// Screens and navigation.
//
// Installed to the home screen there is no browser chrome, so every screen
// past Home carries its own back control and pushes a history entry for the
// swipe-back gesture.

import { LEVELS, HELP, TOTAL_EXERCISES } from './curriculum.js';
import { checkExercise } from './checker.js';
import { Interpreter } from './interpreter.js';
import { createEditor, mountKeybar } from './editor.js';
import * as store from './storage.js';

const screen = document.getElementById('screen');
const topbarTitle = document.getElementById('topbar-title');
const backButton = document.getElementById('back');
const xpChip = document.getElementById('xp-chip');
const streakChip = document.getElementById('streak-chip');

let teardownKeybar = null;

// ---------------------------------------------------------------- helpers

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.filter((c) => c != null));
  return node;
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** Lesson prose uses `backticks` for code and **stars** for emphasis. */
function richText(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function codeBlock(code) {
  return el('pre', {}, el('code', { html: escapeHtml(code) }));
}

function isUnlocked(index) {
  if (index === 0) return true;
  return store.levelState(LEVELS[index - 1].id).completed;
}

function levelProgress(level) {
  const state = store.levelState(level.id);
  const solved = level.exercises.filter((ex) => state.exercises[ex.id]?.solved).length;
  return { solved, total: level.exercises.length, completed: state.completed };
}

function refreshStats() {
  const data = store.load();
  xpChip.textContent = `${data.xp} XP`;
  streakChip.hidden = data.streakCount < 1;
  streakChip.textContent = `🔥 ${data.streakCount}`;
}

// ------------------------------------------------------------- navigation

const stack = [];

function go(render, title, { replace = false } = {}) {
  if (teardownKeybar) { teardownKeybar(); teardownKeybar = null; }
  if (replace) {
    stack[stack.length - 1] = { render, title };
    history.replaceState({ depth: stack.length }, '');
  } else {
    stack.push({ render, title });
    history.pushState({ depth: stack.length }, '');
  }
  draw();
}

/** Move within the current screen (lesson cards, questions) without a history entry. */
function swap(render) {
  stack[stack.length - 1].render = render;
  screen.replaceChildren();
  refreshStats();
  render();
  window.scrollTo(0, 0);
}

function back() {
  if (stack.length > 1) history.back();
}

function goHome() {
  if (stack.length > 1) history.go(-(stack.length - 1));
}

function draw() {
  const current = stack[stack.length - 1];
  topbarTitle.textContent = current.title;
  backButton.hidden = stack.length <= 1;
  screen.replaceChildren();
  refreshStats();
  current.render();
  window.scrollTo(0, 0);
}

// history.go(-n) fires a single popstate, so the stack is resynced from the
// entry's own depth rather than popped one at a time.
window.addEventListener('popstate', (event) => {
  const depth = event.state?.depth ?? 1;
  if (depth < stack.length) {
    if (teardownKeybar) { teardownKeybar(); teardownKeybar = null; }
    stack.length = depth;
    draw();
  }
});

backButton.addEventListener('click', back);

// ------------------------------------------------------------------ home

function renderHome() {
  const data = store.load();
  const solvedTotal = LEVELS.reduce((n, level) => n + levelProgress(level).solved, 0);

  screen.append(
    el('h1', {}, 'Learn Python'),
    el('p', { class: 'dim' }, 'Read a little, write real code, then check you understood it. Your code actually runs.'),
    el('div', { class: 'stat-row' },
      el('div', { class: 'stat' }, el('div', { class: 'n' }, String(data.xp)), el('div', { class: 'l' }, 'XP')),
      el('div', { class: 'stat' },
        el('div', { class: 'n' }, `${solvedTotal}/${TOTAL_EXERCISES}`),
        el('div', { class: 'l' }, 'exercises')),
      el('div', { class: 'stat' },
        el('div', { class: 'n' }, String(data.streakCount)),
        el('div', { class: 'l' }, 'day streak')),
    ),
  );

  LEVELS.forEach((level, index) => {
    const { solved, total, completed } = levelProgress(level);
    const unlocked = isUnlocked(index);

    const dots = el('div', { class: 'dots' });
    level.exercises.forEach((ex) => {
      dots.append(el('span', {
        class: 'dot' + (store.levelState(level.id).exercises[ex.id]?.solved ? ' on' : ''),
      }));
    });

    screen.append(el('button', {
      class: 'level',
      disabled: !unlocked,
      onclick: () => unlocked && openLevel(index),
    },
      el('span', { class: 'emoji' }, unlocked ? level.icon : '🔒'),
      el('span', { class: 'body' },
        el('span', { class: 'name' }, `${index + 1}. ${level.title}`),
        el('div', { class: 'tag' }, unlocked ? level.tagline : 'Finish the level before this one'),
        unlocked ? dots : null,
      ),
      completed ? el('span', { class: 'done-badge' }, '✓') : null,
    ));
  });

  screen.append(
    el('p', { class: 'dim small', style: 'margin-top:20px' },
      'Progress is saved on this device only — nothing is uploaded anywhere.'),
    el('button', {
      class: 'btn ghost small',
      onclick: () => {
        if (confirm('Erase all progress and start over?')) {
          store.resetAll();
          draw();
        }
      },
    }, 'Reset progress'),
  );
}

// ---------------------------------------------------------------- lessons

function openLevel(index) {
  const level = LEVELS[index];
  go(() => renderLesson(level, index, 0), level.title);
}

function renderLesson(level, levelIndex, cardIndex) {
  const card = level.lesson[cardIndex];
  const last = cardIndex === level.lesson.length - 1;

  const bar = el('div', { class: 'progress-line' });
  level.lesson.forEach((_, i) => bar.append(el('span', { class: i <= cardIndex ? 'on' : '' })));

  const body = el('div', { class: 'card' },
    el('h2', {}, card.heading),
    el('div', { html: richText(card.body) }),
  );

  if (card.code) {
    body.append(codeBlock(card.code));
    const outputBox = el('div');
    body.append(
      el('button', {
        class: 'btn secondary',
        onclick: () => {
          const result = new Interpreter().run(card.code);
          outputBox.replaceChildren(
            el('div', { class: 'out-label' }, 'Output'),
            codeBlock(result.ok ? result.output.trimEnd() : result.error),
          );
        },
      }, '▶ Run this example'),
      outputBox,
    );
  }

  screen.append(
    bar,
    body,
    el('div', { class: 'btn-row' },
      cardIndex > 0
        ? el('button', {
            class: 'btn secondary',
            onclick: () => swap(() => renderLesson(level, levelIndex, cardIndex - 1)),
          }, 'Back')
        : null,
      el('button', {
        class: 'btn',
        onclick: () => {
          if (last) go(() => renderExercise(level, levelIndex, 0), `${level.title} · Practice`);
          else swap(() => renderLesson(level, levelIndex, cardIndex + 1));
        },
      }, last ? 'Start exercises →' : 'Next'),
    ),
  );
}

// -------------------------------------------------------------- exercises

function renderExercise(level, levelIndex, exerciseIndex) {
  const exercise = level.exercises[exerciseIndex];
  const state = store.exerciseState(level.id, exercise.id);
  const startingCode = store.getDraft(exercise.id) ?? exercise.starter;

  let hintsShown = 0;

  const { wrap, textarea } = createEditor(startingCode);
  const resultsBox = el('div');
  const hintsBox = el('div');

  textarea.addEventListener('input', () => store.saveDraft(exercise.id, textarea.value));

  const nextButton = el('button', {
    class: 'btn',
    hidden: !state.solved,
    onclick: () => {
      if (exerciseIndex + 1 < level.exercises.length) {
        go(() => renderExercise(level, levelIndex, exerciseIndex + 1),
          `${level.title} · Practice`, { replace: true });
      } else {
        go(() => renderQa(level, levelIndex, 0), `${level.title} · Review`, { replace: true });
      }
    },
  }, exerciseIndex + 1 < level.exercises.length ? 'Next exercise →' : 'Review questions →');

  const runButton = el('button', {
    class: 'btn',
    onclick: () => {
      const code = textarea.value;
      store.recordAttempt(level.id, exercise.id);
      const result = checkExercise(code, exercise.tests);
      showResults(result);

      if (result.passed) {
        const earned = store.recordSolved(level.id, exercise.id);
        store.clearDraft(exercise.id);
        refreshStats();
        resultsBox.prepend(el('div', { class: 'banner win' },
          earned > 0 ? `Solved — +${earned} XP` : 'Solved again — nice.'));
        nextButton.hidden = false;
        nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
  }, '▶ Run tests');

  function showResults(result) {
    resultsBox.replaceChildren();

    if (result.error) {
      resultsBox.append(
        el('div', { class: 'out-label' }, 'Python stopped'),
        el('div', { class: 'error-box' }, result.error),
      );
      if (result.output) {
        resultsBox.append(
          el('div', { class: 'out-label' }, 'Printed before the error'),
          codeBlock(result.output.trimEnd()),
        );
      }
      return;
    }

    resultsBox.append(el('div', { class: 'out-label' },
      `${result.results.filter((r) => r.ok).length} of ${result.results.length} checks passed`));

    for (const check of result.results) {
      const detail = el('div', { class: 'detail' }, el('div', {}, check.label));
      if (!check.ok) {
        detail.append(el('div', { class: 'cmp' },
          check.note
            ? check.note
            : `expected: ${display(check.expected, check.isText)}\n     got: ${display(check.actual, check.isText)}`));
      }
      resultsBox.append(el('div', { class: 'result' + (check.ok ? ' pass' : '') },
        el('span', { class: 'mark' }, check.ok ? '✓' : '✕'), detail));
    }

    if (result.output) {
      resultsBox.append(
        el('div', { class: 'out-label' }, 'Your output'),
        codeBlock(result.output.trimEnd() || '(nothing printed)'),
      );
    }
  }

  function display(value, isText) {
    if (value === null || value === undefined) return '(nothing)';
    return isText ? JSON.stringify(value) : String(value);
  }

  const hintButton = el('button', {
    class: 'btn secondary',
    onclick: () => {
      if (hintsShown >= exercise.hints.length) return;
      const hint = exercise.hints[hintsShown];
      hintsShown += 1;
      store.recordHint(level.id, exercise.id);
      const isSolution = hintsShown === exercise.hints.length;
      const box = el('div', { class: 'hint' },
        el('strong', {}, isSolution ? 'Full solution' : `Hint ${hintsShown}`));
      if (hint.includes('\n') || isSolution) box.append(codeBlock(hint));
      else box.append(el('div', { html: richText(hint) }));
      hintsBox.append(box);
      if (hintsShown >= exercise.hints.length) {
        hintButton.disabled = true;
        hintButton.textContent = 'No more hints';
      } else {
        hintButton.textContent = `Show hint ${hintsShown + 1} of ${exercise.hints.length}`;
      }
    },
  }, `Show hint 1 of ${exercise.hints.length}`);

  const helpRows = el('table', { class: 'help-table' });
  for (const [syntax, meaning] of HELP[level.id]) {
    helpRows.append(el('tr', {}, el('td', {}, syntax), el('td', { class: 'dim' }, meaning)));
  }

  screen.append(
    el('div', { class: 'progress-line' },
      ...level.exercises.map((_, i) => el('span', { class: i <= exerciseIndex ? 'on' : '' }))),
    el('div', { class: 'card' },
      el('h2', {}, `Exercise ${exerciseIndex + 1} of ${level.exercises.length}`),
      el('div', { html: richText(exercise.brief) }),
    ),
    wrap,
    runButton,
    resultsBox,
    el('div', { class: 'btn-row' }, hintButton),
    hintsBox,
    el('details', { class: 'help' },
      el('summary', {}, `help() — ${level.title}`),
      helpRows),
    nextButton,
    el('div', { class: 'spacer' }),
  );

  teardownKeybar = mountKeybar(textarea);
}

// ---------------------------------------------------------------- review

function renderQa(level, levelIndex, questionIndex) {
  const question = level.qa[questionIndex];
  const last = questionIndex === level.qa.length - 1;

  const feedback = el('div');
  const next = el('button', {
    class: 'btn',
    hidden: true,
    onclick: () => {
      if (last) go(() => renderLevelDone(level, levelIndex), level.title, { replace: true });
      else swap(() => renderQa(level, levelIndex, questionIndex + 1));
    },
  }, last ? 'Finish level →' : 'Next question');

  const options = el('div');
  question.options.forEach((text, index) => {
    options.append(el('button', {
      class: 'choice',
      onclick: (event) => {
        const correct = index === question.answer;
        store.recordQa(level.id, `${levelIndex}-${questionIndex}`, correct);
        for (const button of options.children) {
          button.disabled = true;
          button.classList.remove('correct', 'wrong');
        }
        options.children[question.answer].classList.add('correct');
        if (!correct) event.currentTarget.classList.add('wrong');
        feedback.replaceChildren(el('div', { class: 'card' },
          el('strong', {}, correct ? 'Right. ' : 'Not quite. '),
          el('span', { html: richText(question.explain) })));
        next.hidden = false;
        refreshStats();
      },
    }, text));
  });

  screen.append(
    el('div', { class: 'progress-line' },
      ...level.qa.map((_, i) => el('span', { class: i <= questionIndex ? 'on' : '' }))),
    el('div', { class: 'card' }, el('h2', {}, question.question)),
    options,
    feedback,
    next,
  );
}

function renderLevelDone(level, levelIndex) {
  const bonus = store.completeLevel(level.id);
  refreshStats();
  const nextLevel = LEVELS[levelIndex + 1];

  screen.append(
    el('div', { class: 'banner win' }, `${level.icon} ${level.title} complete${bonus ? ` — +${bonus} XP` : ''}`),
    el('div', { class: 'card' },
      el('h2', {}, 'Nice work'),
      el('p', { class: 'dim' },
        nextLevel
          ? `Next up: ${nextLevel.title} — ${nextLevel.tagline}.`
          : 'That is the whole course. Every level stays open if you want another pass.'),
    ),
    nextLevel
      ? el('button', {
          class: 'btn',
          onclick: () => go(() => renderLesson(nextLevel, levelIndex + 1, 0), nextLevel.title, { replace: true }),
        }, `Start ${nextLevel.title} →`)
      : null,
    el('button', {
      class: 'btn secondary',
      style: 'margin-top:10px',
      onclick: goHome,
    }, 'Back to levels'),
  );
}

// ------------------------------------------------------------------ start

stack.push({ render: renderHome, title: 'PyQuest' });
history.replaceState({ depth: 1 }, '');
draw();
