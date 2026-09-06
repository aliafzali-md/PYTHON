#!/usr/bin/env python3
"""Verify the curriculum against real CPython.

The JS test suite proves every solution passes under the game's interpreter.
This proves the same solutions and expected outputs are genuine Python — so a
lesson can never teach something CPython disagrees with.
"""
import io
import json
import contextlib
import subprocess
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
DUMP = "import {LEVELS} from './docs/js/curriculum.js'; console.log(JSON.stringify(LEVELS));"


def load_curriculum():
    script = ROOT.parent / ".curriculum_dump.mjs"
    script.write_text(DUMP)
    try:
        out = subprocess.run(
            ["node", str(script)], cwd=ROOT.parent,
            capture_output=True, text=True, check=True,
        )
        return json.loads(out.stdout)
    finally:
        script.unlink(missing_ok=True)


def run_code(code):
    """Exec code in a fresh namespace, returning (globals, printed output)."""
    namespace = {}
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        exec(compile(code, "<solution>", "exec"), namespace)
    return namespace, buffer.getvalue()


def check_exercise(exercise, failures, label):
    code = exercise["solution"]
    try:
        namespace, printed = run_code(code)
    except Exception as exc:
        failures.append(f"{label}: solution raised {type(exc).__name__}: {exc}")
        return

    for test in exercise["tests"]:
        if "stdout" in test:
            if printed != test["stdout"]:
                failures.append(
                    f"{label}: printed {printed!r}, curriculum expects {test['stdout']!r}")
        elif "variable" in test:
            name = test["variable"]
            if name not in namespace:
                failures.append(f"{label}: solution never defines {name}")
                continue
            expected = eval(test["expect"], {})
            actual = namespace[name]
            if actual != expected or type(actual) is not type(expected):
                failures.append(
                    f"{label}: {name} is {actual!r} ({type(actual).__name__}), "
                    f"curriculum expects {expected!r} ({type(expected).__name__})")
        else:
            expected = eval(test["expect"], {})
            try:
                actual = eval(test["call"], namespace)
            except Exception as exc:
                failures.append(f"{label}: {test['call']} raised {type(exc).__name__}: {exc}")
                continue
            if actual != expected or type(actual) is not type(expected):
                failures.append(
                    f"{label}: {test['call']} gives {actual!r} ({type(actual).__name__}), "
                    f"curriculum expects {expected!r} ({type(expected).__name__})")


def check_lesson(card, failures, label):
    if not card.get("code"):
        return
    try:
        _, printed = run_code(card["code"])
    except Exception as exc:
        failures.append(f"{label}: example raised {type(exc).__name__}: {exc}")
        return
    expected = (card.get("output") or "").rstrip("\n")
    if printed.rstrip("\n") != expected:
        failures.append(
            f"{label}: example prints {printed.rstrip(chr(10))!r}, lesson claims {expected!r}")


def main():
    levels = load_curriculum()
    failures = []
    exercises = 0
    cards = 0

    for level in levels:
        for card in level["lesson"]:
            if card.get("code"):
                cards += 1
                check_lesson(card, failures, f"{level['id']} lesson '{card['heading']}'")
        for exercise in level["exercises"]:
            exercises += 1
            check_exercise(exercise, failures, f"{level['id']}/{exercise['id']}")
            for i, hint in enumerate(exercise["hints"]):
                # Only the final hint is meant to be a complete solution.
                if i == len(exercise["hints"]) - 1:
                    check_exercise({**exercise, "solution": hint}, failures,
                                   f"{level['id']}/{exercise['id']} final hint")

    if failures:
        print(f"{len(failures)} problem(s) found by CPython {sys.version.split()[0]}:\n")
        for line in failures:
            print(f"  - {line}")
        return 1

    print(f"CPython {sys.version.split()[0]} agrees with all {exercises} exercises "
          f"and {cards} lesson examples.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
