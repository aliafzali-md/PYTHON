# PyQuest

Learn Python fundamentals on your phone by writing real code that really runs.

Nine levels — variables through functions, plus a capstone — each following the
same loop: **learn** a concept from short cards you can run in place, **write**
code against real test cases, then **review** why it worked.

Your code is genuinely executed. Nothing here compares your answer to a stored
string.

---

## Install it on your iPhone

1. Open the site in **Safari** (it must be Safari — Chrome on iOS cannot install
   web apps).
2. Tap the **Share** button, then **Add to Home Screen**.
3. Launch it from the icon. It runs full screen with no browser chrome.

Progress is saved in your browser's local storage on that device. It is never
uploaded, and there is no account and no server to talk to.

## Turning on GitHub Pages

The site is the `docs/` folder, ready to serve as-is — no build step.

1. **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`, folder `/docs`, then **Save**

The URL will be `https://<user>.github.io/PYTHON/`.

Note that GitHub Pages requires a **public** repository on the free plan. The
app itself holds no personal data — everything you do stays in your browser —
but the repository and the URL will be publicly reachable.

## Running it locally

```bash
npm run serve     # http://localhost:8000
```

---

## How your code runs

Real CPython cannot run in a browser without downloading megabytes of
WebAssembly, which would make an app you open for five minutes a day feel
broken. So `docs/js/interpreter.js` is a Python interpreter written in
JavaScript: a tokenizer, a parser and a tree-walking evaluator, about 1,500
lines, no dependencies. It boots instantly.

Python integers are arbitrary precision, so they are represented as `BigInt`
and floats as JavaScript numbers. `2 ** 100` gives the same answer CPython
gives.

### What it supports

`int` `float` `str` `bool` `list` `dict` `tuple` · arithmetic including `//`,
`%` and `**` · chained comparisons · `and` `or` `not` · `if` / `elif` / `else` ·
`for` · `while` · `break` · `continue` · `def` with default and keyword
arguments · f-strings with format specs · slicing with steps · tuple unpacking ·
around twenty builtins and the common `str`, `list` and `dict` methods.

### What it does not

Classes, imports, comprehensions, `try`/`except`, `lambda`, generators, sets.

These are not silently wrong — they raise `NotSupportedError` naming the exact
feature, so the game never tells you your valid Python is broken:

```
NotSupportedError: list comprehensions aren't part of the game's Python yet (line 3)
```

### Guards

Learners write infinite loops. That must not lock up a phone. Execution is
capped at 400,000 steps, 100 stack frames and 500 printed lines, each raising a
readable error rather than freezing the tab.

---

## Tests

```bash
npm test          # unit + both CPython cross-checks
npm run test:e2e  # drives a real browser at iPhone size
```

Three layers, because an interpreter that is subtly wrong teaches subtly wrong
Python:

**Differential testing against real CPython** — `tests/differential.py` runs 25
snippets through both this interpreter and the CPython on your machine and
requires identical stdout, error messages included. This is what keeps the game
honest, and it earns its keep: it caught `nums.sort(True)` being accepted when
real Python takes `reverse` as keyword-only, and two error messages worded
differently from CPython's — which would have sent someone googling a message
that does not exist.

**Curriculum verification** — `tests/verify_curriculum.py` replays every
solution, every final hint and every lesson example through real CPython and
checks the outputs the curriculum claims. A lesson CPython disagrees with fails
the build. The JS side (`tests/curriculum.test.js`) separately proves every
solution passes, every starter *fails*, and every final hint works.

**End to end** — `tests/e2e.mjs` drives Chromium at iPhone 13 size through a
complete level: wrong answer, hint, right answer, syntax error, infinite loop,
review questions, reload. It also asserts the things that make iOS installation
work, and it is what caught the key toolbar sitting on top of every screen.

---

## Layout

```
docs/                     the site (GitHub Pages serves this folder)
  index.html
  manifest.webmanifest    display: standalone, so iOS runs it full screen
  css/styles.css
  icons/                  generated, not hand-drawn
  js/
    interpreter.js        tokenizer, parser, evaluator
    checker.js            runs an exercise's test cases
    curriculum.js         all nine levels
    editor.js             the iPhone-friendly code editor
    storage.js            localStorage progress
    app.js                screens and navigation
tests/
  interpreter.test.js     guards and out-of-subset syntax
  curriculum.test.js      every solution passes, every starter fails
  differential.py         this interpreter vs real CPython
  verify_curriculum.py    the curriculum vs real CPython
  snippets/               the differential corpus
  e2e.mjs                 real browser, iPhone viewport
tools/generate_icons.py   writes PNGs via zlib, no image library needed
```

## Adding a level

Append to `LEVELS` in `docs/js/curriculum.js` and add a matching `HELP` entry.
Tests come in three shapes:

```js
{ stdout: "42\n" }                       // what the program printed
{ variable: "total", expect: "42" }      // a variable it left behind
{ call: "double(21)", expect: "42" }     // calling the learner's function
```

`expect` is a Python expression evaluated to a real value, so `5`, `5.0` and
`"5"` are never confused for one another. Then run `npm test` — CPython will
tell you if the lesson is wrong.
