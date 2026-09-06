#!/usr/bin/env python3
"""Differential test: every snippet must produce identical output under real
CPython and under the game's JavaScript interpreter.

Error snippets are compared on the exception's first line only (CPython prints a
traceback; the game prints one line), so `NameError: name 'x' is not defined`
must match exactly while the surrounding traceback formatting may differ.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SNIPPETS = sorted((ROOT / "snippets").glob("*.py"))


def run_cpython(path):
    proc = subprocess.run(
        [sys.executable, str(path)],
        capture_output=True, text=True, timeout=15,
    )
    out = proc.stdout
    if proc.returncode != 0:
        # Last traceback line is "ExceptionType: message".
        lines = [ln for ln in proc.stderr.strip().split("\n") if ln.strip()]
        out += lines[-1].strip() + "\n" if lines else ""
    return out


def run_game(path):
    proc = subprocess.run(
        ["node", str(ROOT / "run_snippet.mjs")],
        input=path.read_text(), capture_output=True, text=True, timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"interpreter crashed on {path.name}:\n{proc.stderr}")
    return proc.stdout


def strip_line_hint(text):
    """The game appends '(line N)' to errors; CPython puts it in the traceback."""
    return "\n".join(ln.split(" (line ")[0] for ln in text.split("\n"))


def main():
    failures = []
    for path in SNIPPETS:
        expected = run_cpython(path)
        actual = run_game(path)
        if strip_line_hint(actual) != strip_line_hint(expected):
            failures.append((path.name, expected, actual))
            print(f"FAIL  {path.name}")
        else:
            print(f"ok    {path.name}")

    if failures:
        print(f"\n{len(failures)} snippet(s) diverged from CPython:\n")
        for name, expected, actual in failures:
            print(f"--- {name} ---")
            exp_lines = expected.split("\n")
            act_lines = actual.split("\n")
            for i in range(max(len(exp_lines), len(act_lines))):
                e = exp_lines[i] if i < len(exp_lines) else "<missing>"
                a = act_lines[i] if i < len(act_lines) else "<missing>"
                if strip_line_hint(e) != strip_line_hint(a):
                    print(f"  line {i + 1}:\n    cpython: {e!r}\n    game:    {a!r}")
            print()
        return 1

    print(f"\nAll {len(SNIPPETS)} snippets match CPython {sys.version.split()[0]}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
