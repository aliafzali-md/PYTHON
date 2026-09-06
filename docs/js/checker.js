// Runs a learner's code against an exercise's test cases.
//
// Every check executes real code — nothing here compares source text.

import { Interpreter, pyRepr, pyEqual } from './interpreter.js';

/** Evaluate a Python literal from the curriculum into a real value. */
function expectedValue(source) {
  const result = new Interpreter().evalExpression(source);
  if (!result.ok) throw new Error(`bad expectation in curriculum: ${source} -> ${result.error}`);
  return result.value;
}

function describe(test) {
  if (test.stdout !== undefined) return 'what your code prints';
  if (test.variable !== undefined) return `the variable ${test.variable}`;
  return test.call;
}

/**
 * @returns {{passed: boolean, results: Array, error: string|null, output: string}}
 */
export function checkExercise(code, tests) {
  const interp = new Interpreter();
  const run = interp.run(code);

  // A crash means every test fails for the same reason; say it once.
  if (!run.ok) {
    return {
      passed: false,
      error: run.error,
      output: run.output,
      results: tests.map((test) => ({
        label: describe(test),
        ok: false,
        expected: test.stdout !== undefined ? test.stdout : test.expect,
        actual: null,
        note: 'your code stopped with an error',
      })),
    };
  }

  const results = tests.map((test) => {
    const label = describe(test);

    if (test.stdout !== undefined) {
      const ok = run.output === test.stdout;
      return { label, ok, expected: test.stdout, actual: run.output, isText: true };
    }

    if (test.variable !== undefined) {
      if (!interp.globals.has(test.variable)) {
        return {
          label, ok: false,
          expected: test.expect,
          actual: null,
          note: `you never created a variable called ${test.variable}`,
        };
      }
      const actual = interp.globals.get(test.variable);
      const expected = expectedValue(test.expect);
      return {
        label,
        ok: pyEqual(actual, expected) && sameShape(actual, expected),
        expected: pyRepr(expected),
        actual: pyRepr(actual),
      };
    }

    const call = interp.evalExpression(test.call);
    if (!call.ok) {
      return {
        label, ok: false,
        expected: test.expect,
        actual: null,
        note: call.error.startsWith('NameError')
          ? `${call.error} — check the function name and spelling`
          : call.error,
      };
    }
    const expected = expectedValue(test.expect);
    return {
      label,
      ok: pyEqual(call.value, expected) && sameShape(call.value, expected),
      expected: pyRepr(expected),
      actual: pyRepr(call.value),
    };
  });

  return {
    passed: results.every((r) => r.ok),
    error: null,
    output: run.output,
    results,
  };
}

// pyEqual follows Python in saying 1 == 1.0 and 1 == True. For grading, a
// learner who returns True where 1 was asked for has not solved the exercise,
// so the displayed types must line up too.
function sameShape(a, b) {
  const kind = (v) => (typeof v === 'boolean' ? 'bool' : typeof v === 'string' ? 'str' : 'other');
  return kind(a) === kind(b);
}
