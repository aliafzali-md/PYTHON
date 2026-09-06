// Tests for behaviour the CPython differential harness cannot cover:
// runtime guards, out-of-subset syntax, and the evalExpression API the
// exercise checker is built on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Interpreter, pyStr, pyRepr, pyEqual, PyTuple } from '../docs/js/interpreter.js';

const run = (src) => new Interpreter().run(src);

test('stops a runaway while loop instead of hanging', () => {
  const result = run('while True:\n    x = 1\n');
  assert.equal(result.ok, false);
  assert.match(result.error, /TimeoutError/);
  assert.match(result.error, /loop that never ends/);
});

test('stops a runaway for loop', () => {
  const result = run('total = 0\nfor i in range(10000000):\n    total += i\n');
  assert.equal(result.ok, false);
  assert.match(result.error, /TimeoutError/);
});

test('caps runaway printing', () => {
  const result = run('while True:\n    print("spam")\n');
  assert.equal(result.ok, false);
  assert.match(result.error, /OutputError|TimeoutError/);
});

test('caps infinite recursion', () => {
  const result = run('def f(n):\n    return f(n + 1)\nf(0)\n');
  assert.equal(result.ok, false);
  assert.match(result.error, /RecursionError/);
});

test('names unsupported syntax rather than calling it wrong', () => {
  const cases = [
    ['import math', /imports/],
    ['class Dog:\n    pass', /classes/],
    ['try:\n    x = 1\nexcept:\n    pass', /try\/except/],
    ['squares = [x for x in range(3)]', /list comprehensions/],
    ['f = lambda x: x', /lambda/],
    ['name = input("hi")', /input\(\)/],
    ['print("%s" % "x")', /%-formatting/],
  ];
  for (const [src, pattern] of cases) {
    const result = run(src);
    assert.equal(result.ok, false, `expected ${src} to be rejected`);
    assert.match(result.error, /NotSupportedError/, src);
    assert.match(result.error, pattern, src);
  }
});

test('reports the line number of an error', () => {
  const result = run('x = 1\ny = 2\nprint(nope)\n');
  assert.match(result.error, /line 3/);
});

test('flags indentation mistakes', () => {
  const result = run('def f():\nreturn 1\n');
  assert.equal(result.ok, false);
  assert.match(result.error, /IndentationError/);
});

test('evalExpression reads globals left by run', () => {
  const interp = new Interpreter();
  const first = interp.run('def double(n):\n    return n * 2\n');
  assert.equal(first.ok, true);

  const result = interp.evalExpression('double(21)');
  assert.equal(result.ok, true);
  assert.equal(result.value, 42n);
  assert.equal(pyStr(result.value), '42');
});

test('evalExpression surfaces errors without killing the session', () => {
  const interp = new Interpreter();
  interp.run('def half(n):\n    return n / 0\n');

  const bad = interp.evalExpression('half(4)');
  assert.equal(bad.ok, false);
  assert.match(bad.error, /ZeroDivisionError/);

  const good = interp.evalExpression('1 + 1');
  assert.equal(good.ok, true);
  assert.equal(good.value, 2n);
});

test('evalExpression captures print output separately', () => {
  const interp = new Interpreter();
  interp.run('def noisy():\n    print("side effect")\n    return 7\n');
  const result = interp.evalExpression('noisy()');
  assert.equal(result.output, 'side effect\n');
  assert.equal(result.value, 7n);
});

test('pyEqual compares by value across container types', () => {
  assert.ok(pyEqual(1n, 1n));
  assert.ok(pyEqual(1n, 1.0));
  assert.ok(pyEqual([1n, 2n], [1n, 2n]));
  assert.ok(!pyEqual([1n, 2n], [2n, 1n]));
  assert.ok(pyEqual(new PyTuple([1n]), new PyTuple([1n])));
  assert.ok(pyEqual('a', 'a'));
  assert.ok(!pyEqual('1', 1n));
  assert.ok(pyEqual(null, null));
});

test('pyRepr quotes strings the way Python does', () => {
  assert.equal(pyRepr('hi'), "'hi'");
  assert.equal(pyRepr("it's"), '"it\'s"');
  assert.equal(pyRepr([1n, 'a']), "[1, 'a']");
  assert.equal(pyStr([1n, 'a']), "[1, 'a']");
  assert.equal(pyStr('bare'), 'bare');
});

test('a fresh Interpreter does not leak state between runs', () => {
  const interp = new Interpreter();
  interp.run('x = 5\nprint(x)\n');
  const second = interp.run('print("only me")\n');
  assert.equal(second.output, 'only me\n');
});
