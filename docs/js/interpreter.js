// A Python-subset interpreter: tokenizer, parser, tree-walking evaluator.
//
// Python ints are arbitrary precision, so they are represented as BigInt and
// floats as JS numbers. That single choice makes `typeof` the type tag for
// numerics and gives `2 ** 100` the same answer CPython gives.
//
// Values: int=BigInt, float=number, str=string, bool=boolean, None=null,
//         list=Array, tuple=PyTuple, dict=PyDict, function=PyFunction,
//         range=PyRange, builtin=PyBuiltin

export class PyError extends Error {
  constructor(type, message, line) {
    super(message);
    this.pyType = type;
    this.line = line;
  }
  format() {
    const where = this.line ? ` (line ${this.line})` : '';
    return `${this.pyType}: ${this.message}${where}`;
  }
}

// Raised for syntax the game's Python does not implement, so the player is
// never told their valid Python is wrong.
export class NotSupportedError extends PyError {
  constructor(what, line) {
    super('NotSupportedError', `${what} isn't part of the game's Python yet`, line);
  }
}

export class PyTuple {
  constructor(items) { this.items = items; }
}

export class PyDict {
  constructor() { this.map = new Map(); }
  static from(pairs) {
    const d = new PyDict();
    for (const [k, v] of pairs) d.set(k, v);
    return d;
  }
  get size() { return this.map.size; }
  set(k, v) { this.map.set(hashKey(k), [k, v]); }
  get(k) { const e = this.map.get(hashKey(k)); return e ? e[1] : undefined; }
  has(k) { return this.map.has(hashKey(k)); }
  delete(k) { return this.map.delete(hashKey(k)); }
  keys() { return [...this.map.values()].map((e) => e[0]); }
  values() { return [...this.map.values()].map((e) => e[1]); }
  entries() { return [...this.map.values()]; }
}

export class PyRange {
  constructor(start, stop, step) { this.start = start; this.stop = stop; this.step = step; }
  toArray() {
    const out = [];
    const { start, stop, step } = this;
    if (step > 0n) for (let i = start; i < stop; i += step) out.push(i);
    else for (let i = start; i > stop; i += step) out.push(i);
    return out;
  }
  get length() { return BigInt(this.toArray().length); }
}

class PyFunction {
  constructor(name, params, defaults, body, scope) {
    this.name = name; this.params = params; this.defaults = defaults;
    this.body = body; this.scope = scope;
  }
}

class PyBuiltin {
  constructor(name, fn) { this.name = name; this.fn = fn; }
}

// Dict keys must compare by value, so tuples and numbers get a stable tag.
function hashKey(v) {
  if (typeof v === 'string') return 's:' + v;
  if (typeof v === 'bigint') return 'n:' + v.toString();
  if (typeof v === 'number') return 'n:' + (Number.isInteger(v) ? BigInt(v).toString() : v);
  if (typeof v === 'boolean') return 'n:' + (v ? '1' : '0');
  if (v === null) return 'none';
  if (v instanceof PyTuple) return 't:(' + v.items.map(hashKey).join(',') + ')';
  throw new PyError('TypeError', `unhashable type: '${typeName(v)}'`);
}

// ---------------------------------------------------------------------------
// Types, display
// ---------------------------------------------------------------------------

export function typeName(v) {
  if (v === null) return 'NoneType';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'bigint') return 'int';
  if (typeof v === 'number') return 'float';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) return 'list';
  if (v instanceof PyTuple) return 'tuple';
  if (v instanceof PyDict) return 'dict';
  if (v instanceof PyRange) return 'range';
  if (v instanceof PyFunction || v instanceof PyBuiltin) return 'function';
  return 'object';
}

function formatFloat(n) {
  if (Number.isNaN(n)) return 'nan';
  if (n === Infinity) return 'inf';
  if (n === -Infinity) return '-inf';
  if (Number.isInteger(n) && Math.abs(n) < 1e16) return n.toFixed(1);
  const s = String(n);
  // JS writes 1e+21; Python writes 1e+21 too, but 1e-7 as 1e-07.
  return s.replace(/e([+-])(\d)$/, 'e$10$2');
}

export function pyStr(v) {
  if (v === null) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return formatFloat(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
  if (v instanceof PyTuple) {
    if (v.items.length === 1) return '(' + pyRepr(v.items[0]) + ',)';
    return '(' + v.items.map(pyRepr).join(', ') + ')';
  }
  if (v instanceof PyDict) {
    return '{' + v.entries().map(([k, val]) => `${pyRepr(k)}: ${pyRepr(val)}`).join(', ') + '}';
  }
  if (v instanceof PyRange) {
    return v.step === 1n ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
  }
  if (v instanceof PyFunction) return `<function ${v.name}>`;
  if (v instanceof PyBuiltin) return `<built-in function ${v.name}>`;
  return String(v);
}

export function pyRepr(v) {
  if (typeof v === 'string') {
    const escaped = v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    return escaped.includes("'") && !escaped.includes('"')
      ? `"${escaped}"`
      : `'${escaped.replace(/'/g, "\\'")}'`;
  }
  return pyStr(v);
}

export function truthy(v) {
  if (v === null || v === false) return false;
  if (v === true) return true;
  if (typeof v === 'bigint') return v !== 0n;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (v instanceof PyTuple) return v.items.length > 0;
  if (v instanceof PyDict) return v.size > 0;
  if (v instanceof PyRange) return v.toArray().length > 0;
  return true;
}

export function pyEqual(a, b) {
  if (isNum(a) && isNum(b)) {
    if (typeof a === 'boolean' || typeof b === 'boolean') {
      if (typeof a !== typeof b && (typeof a === 'string' || typeof b === 'string')) return false;
    }
    return numCompare(a, b) === 0;
  }
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => pyEqual(x, b[i]));
  }
  if (a instanceof PyTuple && b instanceof PyTuple) {
    return a.items.length === b.items.length && a.items.every((x, i) => pyEqual(x, b.items[i]));
  }
  if (a instanceof PyDict && b instanceof PyDict) {
    if (a.size !== b.size) return false;
    return a.entries().every(([k, v]) => b.has(k) && pyEqual(b.get(k), v));
  }
  return a === b;
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

function isNum(v) {
  return typeof v === 'bigint' || typeof v === 'number' || typeof v === 'boolean';
}
function isIntLike(v) { return typeof v === 'bigint' || typeof v === 'boolean'; }
function toBig(v) { return typeof v === 'boolean' ? (v ? 1n : 0n) : v; }
function toNum(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'bigint') return Number(v);
  return v;
}

function numCompare(a, b) {
  if (isIntLike(a) && isIntLike(b)) {
    const x = toBig(a), y = toBig(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const x = toNum(a), y = toNum(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

function floorDivBig(a, b) {
  if (b === 0n) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero');
  let q = a / b;
  if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) q -= 1n;
  return q;
}

function modBig(a, b) {
  if (b === 0n) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero');
  const r = a % b;
  return r !== 0n && (r < 0n) !== (b < 0n) ? r + b : r;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
  'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue',
  'and', 'or', 'not', 'True', 'False', 'None', 'pass', 'is',
]);

const UNSUPPORTED_KEYWORDS = {
  class: 'classes', import: 'imports', from: 'imports', try: 'try/except',
  except: 'try/except', finally: 'try/except', raise: 'raise', with: 'with blocks',
  lambda: 'lambda', yield: 'generators', global: 'the global keyword',
  nonlocal: 'the nonlocal keyword', assert: 'assert', del: 'del', async: 'async',
  await: 'await',
};

const OPERATORS = [
  '**=', '//=', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '**', '//',
  '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.',
];

function tokenize(src) {
  const tokens = [];
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const indents = [0];
  let depth = 0;
  let line = 0;

  while (line < lines.length) {
    let text = lines[line];
    const lineNo = line + 1;
    line++;

    if (depth === 0) {
      const stripped = text.trim();
      if (stripped === '' || stripped.startsWith('#')) continue;
      if (text.includes('\t')) text = text.replace(/\t/g, '    ');
      const indent = text.length - text.trimStart().length;
      if (indent > indents[indents.length - 1]) {
        indents.push(indent);
        tokens.push({ type: 'INDENT', line: lineNo });
      } else {
        while (indent < indents[indents.length - 1]) {
          indents.pop();
          tokens.push({ type: 'DEDENT', line: lineNo });
        }
        if (indent !== indents[indents.length - 1]) {
          throw new PyError('IndentationError', 'unindent does not match any outer indentation level', lineNo);
        }
      }
    }

    let i = depth === 0 ? text.length - text.trimStart().length : 0;
    while (i < text.length) {
      const c = text[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '#') break;

      // f-string
      if ((c === 'f' || c === 'F') && (text[i + 1] === '"' || text[i + 1] === "'")) {
        const quote = text[i + 1];
        const [raw, next] = readString(text, i + 2, quote, lineNo);
        tokens.push({ type: 'FSTRING', value: raw, line: lineNo });
        i = next;
        continue;
      }
      if (c === '"' || c === "'") {
        const [raw, next] = readString(text, i + 1, c, lineNo);
        tokens.push({ type: 'STRING', value: unescape(raw), line: lineNo });
        i = next;
        continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(text[i + 1] || ''))) {
        let j = i;
        let isFloat = false;
        while (j < text.length && /[0-9_]/.test(text[j])) j++;
        if (text[j] === '.' && /[0-9]/.test(text[j + 1] || '')) {
          isFloat = true; j++;
          while (j < text.length && /[0-9_]/.test(text[j])) j++;
        } else if (text[j] === '.') { isFloat = true; j++; }
        if (text[j] === 'e' || text[j] === 'E') {
          let k = j + 1;
          if (text[k] === '+' || text[k] === '-') k++;
          if (/[0-9]/.test(text[k] || '')) {
            isFloat = true; j = k;
            while (j < text.length && /[0-9]/.test(text[j])) j++;
          }
        }
        const numText = text.slice(i, j).replace(/_/g, '');
        tokens.push({
          type: 'NUMBER',
          value: isFloat ? parseFloat(numText) : BigInt(numText),
          line: lineNo,
        });
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < text.length && /[A-Za-z0-9_]/.test(text[j])) j++;
        const word = text.slice(i, j);
        if (UNSUPPORTED_KEYWORDS[word]) throw new NotSupportedError(UNSUPPORTED_KEYWORDS[word], lineNo);
        tokens.push({ type: KEYWORDS.has(word) ? 'KEYWORD' : 'NAME', value: word, line: lineNo });
        i = j;
        continue;
      }
      const op = OPERATORS.find((o) => text.startsWith(o, i));
      if (!op) throw new PyError('SyntaxError', `invalid character '${c}'`, lineNo);
      if ('([{'.includes(op)) depth++;
      if (')]}'.includes(op)) depth = Math.max(0, depth - 1);
      tokens.push({ type: 'OP', value: op, line: lineNo });
      i += op.length;
    }

    if (depth === 0) tokens.push({ type: 'NEWLINE', line: lineNo });
  }

  while (indents.length > 1) { indents.pop(); tokens.push({ type: 'DEDENT', line: lines.length }); }
  tokens.push({ type: 'EOF', line: lines.length });
  return tokens;
}

function readString(text, start, quote, lineNo) {
  let out = '';
  let i = start;
  while (i < text.length) {
    if (text[i] === '\\') { out += text[i] + (text[i + 1] || ''); i += 2; continue; }
    if (text[i] === quote) return [out, i + 1];
    out += text[i];
    i++;
  }
  throw new PyError('SyntaxError', 'unterminated string literal', lineNo);
}

function unescape(s) {
  return s.replace(/\\(.)/g, (_, c) => (
    { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0' }[c] ?? '\\' + c
  ));
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }

  peek(offset = 0) { return this.tokens[this.pos + offset]; }
  get line() { return this.peek().line; }
  next() { return this.tokens[this.pos++]; }

  at(type, value) {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }
  accept(type, value) { return this.at(type, value) ? this.next() : null; }
  expect(type, value) {
    if (this.at(type, value)) return this.next();
    const t = this.peek();
    const got = t.type === 'NEWLINE' ? 'end of line' : `'${t.value ?? t.type}'`;
    throw new PyError('SyntaxError', `expected ${value ? `'${value}'` : type}, got ${got}`, t.line);
  }

  parseProgram() {
    const body = [];
    while (!this.at('EOF')) {
      if (this.accept('NEWLINE')) continue;
      if (this.at('INDENT')) throw new PyError('IndentationError', 'unexpected indent', this.line);
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  // `context` and `line` reproduce CPython's "expected an indented block after
  // 'if' statement on line 3", which is the error beginners hit most.
  parseBlock(context, line) {
    this.expect('OP', ':');
    const body = [];
    if (this.accept('NEWLINE')) {
      if (!this.at('INDENT')) {
        throw new PyError('IndentationError',
          `expected an indented block after ${context} on line ${line}`, this.line);
      }
      this.next();
      while (!this.at('DEDENT') && !this.at('EOF')) {
        if (this.accept('NEWLINE')) continue;
        if (this.at('INDENT')) throw new PyError('IndentationError', 'unexpected indent', this.line);
        body.push(this.parseStatement());
      }
      this.accept('DEDENT');
    } else {
      body.push(this.parseStatement());
    }
    if (body.length === 0) {
      throw new PyError('IndentationError',
        `expected an indented block after ${context} on line ${line}`, this.line);
    }
    return body;
  }

  parseStatement() {
    const t = this.peek();
    if (t.type === 'KEYWORD') {
      switch (t.value) {
        case 'if': return this.parseIf();
        case 'while': return this.parseWhile();
        case 'for': return this.parseFor();
        case 'def': return this.parseDef();
        case 'return': {
          this.next();
          const value = this.at('NEWLINE') || this.at('EOF') ? null : this.parseExprList();
          this.accept('NEWLINE');
          return { type: 'Return', value, line: t.line };
        }
        case 'break': this.next(); this.accept('NEWLINE'); return { type: 'Break', line: t.line };
        case 'continue': this.next(); this.accept('NEWLINE'); return { type: 'Continue', line: t.line };
        case 'pass': this.next(); this.accept('NEWLINE'); return { type: 'Pass', line: t.line };
      }
    }
    return this.parseSimpleStatement();
  }

  parseIf() {
    const line = this.line;
    this.expect('KEYWORD', 'if');
    const test = this.parseExpr();
    const body = this.parseBlock("'if' statement", line);
    let orelse = [];
    if (this.at('KEYWORD', 'elif')) {
      orelse = [this.parseElif()];
    } else if (this.at('KEYWORD', 'else')) {
      const elseLine = this.line;
      this.next();
      orelse = this.parseBlock("'else' statement", elseLine);
    }
    return { type: 'If', test, body, orelse, line };
  }

  parseElif() {
    const line = this.line;
    this.expect('KEYWORD', 'elif');
    const test = this.parseExpr();
    const body = this.parseBlock("'elif' statement", line);
    let orelse = [];
    if (this.at('KEYWORD', 'elif')) orelse = [this.parseElif()];
    else if (this.at('KEYWORD', 'else')) {
      const elseLine = this.line;
      this.next();
      orelse = this.parseBlock("'else' statement", elseLine);
    }
    return { type: 'If', test, body, orelse, line };
  }

  parseWhile() {
    const line = this.line;
    this.expect('KEYWORD', 'while');
    const test = this.parseExpr();
    const body = this.parseBlock("'while' statement", line);
    return { type: 'While', test, body, line };
  }

  parseFor() {
    const line = this.line;
    this.expect('KEYWORD', 'for');
    const target = this.parseTargetList();
    this.expect('KEYWORD', 'in');
    const iter = this.parseExprList();
    const body = this.parseBlock("'for' statement", line);
    return { type: 'For', target, iter, body, line };
  }

  parseTargetList() {
    const first = this.parseTarget();
    if (!this.at('OP', ',')) return first;
    const items = [first];
    while (this.accept('OP', ',')) {
      if (this.at('KEYWORD', 'in') || this.at('OP', '=')) break;
      items.push(this.parseTarget());
    }
    return { type: 'TupleTarget', items, line: first.line };
  }

  parseTarget() {
    if (this.accept('OP', '(')) {
      const inner = this.parseTargetList();
      this.expect('OP', ')');
      return inner;
    }
    return this.parseUnary();
  }

  parseDef() {
    const line = this.line;
    this.expect('KEYWORD', 'def');
    const name = this.expect('NAME').value;
    this.expect('OP', '(');
    const params = [];
    const defaults = [];
    while (!this.at('OP', ')')) {
      const p = this.expect('NAME').value;
      params.push(p);
      defaults.push(this.accept('OP', '=') ? this.parseExpr() : null);
      if (!this.accept('OP', ',')) break;
    }
    this.expect('OP', ')');
    const body = this.parseBlock('function definition', line);
    return { type: 'FuncDef', name, params, defaults, body, line };
  }

  parseSimpleStatement() {
    const line = this.line;
    const expr = this.parseExprList();

    const augOps = ['+=', '-=', '*=', '/=', '//=', '%=', '**='];
    for (const op of augOps) {
      if (this.at('OP', op)) {
        this.next();
        const value = this.parseExprList();
        this.accept('NEWLINE');
        return { type: 'AugAssign', target: expr, op: op.slice(0, -1), value, line };
      }
    }

    if (this.at('OP', '=')) {
      const targets = [expr];
      let value = null;
      while (this.accept('OP', '=')) {
        value = this.parseExprList();
        if (this.at('OP', '=')) { targets.push(value); }
      }
      this.accept('NEWLINE');
      return { type: 'Assign', targets, value, line };
    }

    this.accept('NEWLINE');
    return { type: 'ExprStmt', value: expr, line };
  }

  // Bare `a, b` builds a tuple (used by assignment, return and for-in).
  parseExprList() {
    const first = this.parseExpr();
    if (!this.at('OP', ',')) return first;
    const items = [first];
    while (this.accept('OP', ',')) {
      if (this.at('NEWLINE') || this.at('EOF') || this.at('OP', '=') || this.at('OP', ')')) break;
      items.push(this.parseExpr());
    }
    return { type: 'Tuple', items, line: first.line };
  }

  parseExpr() { return this.parseTernary(); }

  parseTernary() {
    const value = this.parseOr();
    if (this.at('KEYWORD', 'if')) {
      const line = this.line;
      this.next();
      const test = this.parseOr();
      this.expect('KEYWORD', 'else');
      const orelse = this.parseTernary();
      return { type: 'IfExp', test, body: value, orelse, line };
    }
    return value;
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.at('KEYWORD', 'or')) {
      const line = this.line; this.next();
      left = { type: 'BoolOp', op: 'or', left, right: this.parseAnd(), line };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.at('KEYWORD', 'and')) {
      const line = this.line; this.next();
      left = { type: 'BoolOp', op: 'and', left, right: this.parseNot(), line };
    }
    return left;
  }

  parseNot() {
    if (this.at('KEYWORD', 'not')) {
      const line = this.line; this.next();
      return { type: 'UnaryOp', op: 'not', operand: this.parseNot(), line };
    }
    return this.parseComparison();
  }

  parseComparison() {
    const first = this.parseArith();
    const ops = [];
    const comparators = [];
    for (;;) {
      let op = null;
      if (this.at('OP', '==')) op = '==';
      else if (this.at('OP', '!=')) op = '!=';
      else if (this.at('OP', '<')) op = '<';
      else if (this.at('OP', '>')) op = '>';
      else if (this.at('OP', '<=')) op = '<=';
      else if (this.at('OP', '>=')) op = '>=';
      else if (this.at('KEYWORD', 'in')) op = 'in';
      else if (this.at('KEYWORD', 'is')) op = 'is';
      else if (this.at('KEYWORD', 'not') && this.peek(1).type === 'KEYWORD' && this.peek(1).value === 'in') {
        this.next(); op = 'not in';
      }
      if (!op) break;
      this.next();
      if (op === 'is' && this.at('KEYWORD', 'not')) { this.next(); op = 'is not'; }
      ops.push(op);
      comparators.push(this.parseArith());
    }
    if (ops.length === 0) return first;
    return { type: 'Compare', left: first, ops, comparators, line: first.line };
  }

  parseArith() {
    let left = this.parseTerm();
    while (this.at('OP', '+') || this.at('OP', '-')) {
      const line = this.line;
      const op = this.next().value;
      left = { type: 'BinOp', op, left, right: this.parseTerm(), line };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseUnary();
    while (this.at('OP', '*') || this.at('OP', '/') || this.at('OP', '//') || this.at('OP', '%')) {
      const line = this.line;
      const op = this.next().value;
      left = { type: 'BinOp', op, left, right: this.parseUnary(), line };
    }
    return left;
  }

  parseUnary() {
    if (this.at('OP', '-') || this.at('OP', '+')) {
      const line = this.line;
      const op = this.next().value;
      return { type: 'UnaryOp', op, operand: this.parseUnary(), line };
    }
    return this.parsePower();
  }

  parsePower() {
    const base = this.parsePostfix();
    if (this.at('OP', '**')) {
      const line = this.line;
      this.next();
      return { type: 'BinOp', op: '**', left: base, right: this.parseUnary(), line };
    }
    return base;
  }

  parsePostfix() {
    let node = this.parseAtom();
    for (;;) {
      if (this.at('OP', '(')) {
        const line = this.line;
        this.next();
        const args = [];
        const keywords = [];
        while (!this.at('OP', ')')) {
          if (this.at('NAME') && this.peek(1).type === 'OP' && this.peek(1).value === '=') {
            const name = this.next().value;
            this.next();
            keywords.push({ name, node: this.parseExpr() });
          } else {
            if (keywords.length > 0) {
              throw new PyError('SyntaxError', 'positional argument follows keyword argument', line);
            }
            args.push(this.parseExpr());
          }
          if (!this.accept('OP', ',')) break;
        }
        this.expect('OP', ')');
        node = { type: 'Call', func: node, args, keywords, line };
      } else if (this.at('OP', '[')) {
        const line = this.line;
        this.next();
        node = { ...this.parseSubscript(node, line) };
        this.expect('OP', ']');
      } else if (this.at('OP', '.')) {
        const line = this.line;
        this.next();
        const attr = this.expect('NAME').value;
        node = { type: 'Attribute', value: node, attr, line };
      } else break;
    }
    return node;
  }

  parseSubscript(value, line) {
    const slot = () => (this.at('OP', ':') || this.at('OP', ']') ? null : this.parseExpr());
    const lower = slot();
    if (!this.at('OP', ':')) return { type: 'Subscript', value, index: lower, line };
    this.next();
    const upper = slot();
    let step = null;
    if (this.accept('OP', ':')) step = slot();
    return { type: 'Slice', value, lower, upper, step, line };
  }

  parseAtom() {
    const t = this.peek();
    if (t.type === 'NUMBER') { this.next(); return { type: 'Const', value: t.value, line: t.line }; }
    if (t.type === 'STRING') { this.next(); return { type: 'Const', value: t.value, line: t.line }; }
    if (t.type === 'FSTRING') { this.next(); return { type: 'FString', parts: parseFStringParts(t.value, t.line), line: t.line }; }
    if (t.type === 'NAME') { this.next(); return { type: 'Name', id: t.value, line: t.line }; }
    if (t.type === 'KEYWORD') {
      if (t.value === 'True') { this.next(); return { type: 'Const', value: true, line: t.line }; }
      if (t.value === 'False') { this.next(); return { type: 'Const', value: false, line: t.line }; }
      if (t.value === 'None') { this.next(); return { type: 'Const', value: null, line: t.line }; }
    }
    if (this.at('OP', '(')) {
      this.next();
      if (this.at('OP', ')')) { this.next(); return { type: 'Tuple', items: [], line: t.line }; }
      const first = this.parseExpr();
      if (this.at('OP', ',')) {
        const items = [first];
        while (this.accept('OP', ',')) {
          if (this.at('OP', ')')) break;
          items.push(this.parseExpr());
        }
        this.expect('OP', ')');
        return { type: 'Tuple', items, line: t.line };
      }
      this.expect('OP', ')');
      return first;
    }
    if (this.at('OP', '[')) {
      this.next();
      const items = [];
      while (!this.at('OP', ']')) {
        items.push(this.parseExpr());
        if (this.at('KEYWORD', 'for')) throw new NotSupportedError('list comprehensions', t.line);
        if (!this.accept('OP', ',')) break;
      }
      this.expect('OP', ']');
      return { type: 'List', items, line: t.line };
    }
    if (this.at('OP', '{')) {
      this.next();
      const keys = [];
      const values = [];
      while (!this.at('OP', '}')) {
        const k = this.parseExpr();
        if (!this.at('OP', ':')) throw new NotSupportedError('sets', t.line);
        this.expect('OP', ':');
        keys.push(k);
        values.push(this.parseExpr());
        if (this.at('KEYWORD', 'for')) throw new NotSupportedError('dict comprehensions', t.line);
        if (!this.accept('OP', ',')) break;
      }
      this.expect('OP', '}');
      return { type: 'Dict', keys, values, line: t.line };
    }
    throw new PyError('SyntaxError', `unexpected ${t.type === 'NEWLINE' ? 'end of line' : `'${t.value ?? t.type}'`}`, t.line);
  }
}

// f-string bodies are re-tokenized per {...} chunk, with an optional :.Nf spec.
function parseFStringParts(raw, line) {
  const parts = [];
  let text = '';
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (c === '{' && raw[i + 1] === '{') { text += '{'; i += 2; continue; }
    if (c === '}' && raw[i + 1] === '}') { text += '}'; i += 2; continue; }
    if (c === '{') {
      if (text) { parts.push({ kind: 'text', value: unescape(text) }); text = ''; }
      let depth = 1;
      let j = i + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === '{') depth++;
        else if (raw[j] === '}') depth--;
        if (depth > 0) j++;
      }
      if (depth !== 0) throw new PyError('SyntaxError', "f-string: expected '}'", line);
      let body = raw.slice(i + 1, j);
      let spec = null;
      const specMatch = body.match(/:([<>^]?\d*(?:\.\d+)?[fd]?)$/);
      if (specMatch) { spec = specMatch[1]; body = body.slice(0, specMatch.index); }
      const inner = new Parser(tokenize(body.trim())).parseExpr();
      parts.push({ kind: 'expr', node: inner, spec });
      i = j + 1;
      continue;
    }
    text += c;
    i++;
  }
  if (text) parts.push({ kind: 'text', value: unescape(text) });
  return parts;
}

function applyFormatSpec(value, spec) {
  if (!spec) return pyStr(value);
  const m = spec.match(/^([<>^]?)(\d*)(?:\.(\d+))?([fd]?)$/);
  if (!m) return pyStr(value);
  const [, align, width, precision, kind] = m;
  let s;
  if (precision !== undefined && (kind === 'f' || kind === '')) {
    if (!isNum(value)) throw new PyError('TypeError', `unsupported format string for ${typeName(value)}`);
    s = toNum(value).toFixed(Number(precision));
  } else if (kind === 'f') {
    s = toNum(value).toFixed(6);
  } else {
    s = pyStr(value);
  }
  if (width) {
    const w = Number(width);
    if (s.length < w) {
      const pad = ' '.repeat(w - s.length);
      if (align === '>') s = pad + s;
      else if (align === '^') {
        const left = Math.floor((w - s.length) / 2);
        s = ' '.repeat(left) + s + ' '.repeat(w - s.length - left);
      } else if (align === '<') s = s + pad;
      else s = isNum(value) ? pad + s : s + pad;
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Control-flow signals
// ---------------------------------------------------------------------------

const BREAK = { signal: 'break' };
const CONTINUE = { signal: 'continue' };
class ReturnSignal { constructor(value) { this.value = value; } }

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

const MAX_STEPS = 400000;
const MAX_DEPTH = 100;
const MAX_OUTPUT_LINES = 500;

export class Interpreter {
  constructor() {
    this.globals = new Map();
    this.buffer = '';
    this.lineCount = 0;
    this.steps = 0;
    this.depth = 0;
    this.builtins = makeBuiltins(this);
  }

  reset() {
    this.globals = new Map();
    this.buffer = '';
    this.lineCount = 0;
    this.steps = 0;
    this.depth = 0;
  }

  write(text, end = '\n') {
    this.lineCount += (end.match(/\n/g) || []).length;
    if (this.lineCount > MAX_OUTPUT_LINES) {
      throw new PyError('OutputError', `printed more than ${MAX_OUTPUT_LINES} lines — is a loop running away?`);
    }
    this.buffer += text + end;
  }

  tick(line) {
    if (++this.steps > MAX_STEPS) {
      throw new PyError('TimeoutError', 'your code ran too long — is there a loop that never ends?', line);
    }
  }

  /** Run a program. Returns {ok, output, error}. */
  run(source) {
    this.buffer = '';
    this.lineCount = 0;
    this.steps = 0;
    this.depth = 0;
    try {
      const ast = new Parser(tokenize(source)).parseProgram();
      this.execBlock(ast.body, this.globals);
      return { ok: true, output: this.buffer, error: null };
    } catch (err) {
      return this.toResult(err);
    }
  }

  /** Evaluate one expression against the globals left behind by run(). */
  evalExpression(source) {
    const before = this.buffer.length;
    this.steps = 0;
    try {
      const ast = new Parser(tokenize(source)).parseProgram();
      const last = ast.body[ast.body.length - 1];
      if (!last || last.type !== 'ExprStmt') {
        throw new PyError('SyntaxError', 'expected an expression');
      }
      for (const stmt of ast.body.slice(0, -1)) this.exec(stmt, this.globals);
      const value = this.eval(last.value, this.globals);
      return { ok: true, value, error: null, output: this.buffer.slice(before) };
    } catch (err) {
      const res = this.toResult(err);
      return { ...res, value: undefined, output: this.buffer.slice(before) };
    }
  }

  toResult(err) {
    if (err instanceof PyError) {
      return { ok: false, output: this.buffer, error: err.format(), pyError: err };
    }
    if (err instanceof RangeError) {
      return {
        ok: false, output: this.buffer,
        error: 'RecursionError: your code called itself too many times',
      };
    }
    throw err;
  }

  execBlock(body, scope) {
    for (const stmt of body) {
      const signal = this.exec(stmt, scope);
      if (signal) return signal;
    }
    return null;
  }

  exec(node, scope) {
    this.tick(node.line);
    switch (node.type) {
      case 'ExprStmt':
        this.eval(node.value, scope);
        return null;

      case 'Assign': {
        const value = this.eval(node.value, scope);
        for (const target of node.targets) this.assign(target, value, scope);
        return null;
      }

      case 'AugAssign': {
        const current = this.eval(node.target, scope);
        const value = this.binop(node.op, current, this.eval(node.value, scope), node.line);
        this.assign(node.target, value, scope);
        return null;
      }

      case 'If':
        if (truthy(this.eval(node.test, scope))) return this.execBlock(node.body, scope);
        return this.execBlock(node.orelse, scope);

      case 'While':
        while (truthy(this.eval(node.test, scope))) {
          this.tick(node.line);
          const signal = this.execBlock(node.body, scope);
          if (signal === BREAK) break;
          if (signal && signal !== CONTINUE) return signal;
        }
        return null;

      case 'For': {
        const iterable = this.iterate(this.eval(node.iter, scope), node.line);
        for (const item of iterable) {
          this.tick(node.line);
          this.assign(node.target, item, scope);
          const signal = this.execBlock(node.body, scope);
          if (signal === BREAK) break;
          if (signal && signal !== CONTINUE) return signal;
        }
        return null;
      }

      case 'FuncDef': {
        const defaults = node.defaults.map((d) => (d ? this.eval(d, scope) : undefined));
        scope.set(node.name, new PyFunction(node.name, node.params, defaults, node.body, scope));
        return null;
      }

      case 'Return':
        return new ReturnSignal(node.value ? this.eval(node.value, scope) : null);

      case 'Break': return BREAK;
      case 'Continue': return CONTINUE;
      case 'Pass': return null;

      default:
        throw new PyError('SyntaxError', `cannot execute ${node.type}`, node.line);
    }
  }

  assign(target, value, scope) {
    switch (target.type) {
      case 'Name':
        scope.set(target.id, value);
        return;

      case 'TupleTarget':
      case 'Tuple':
      case 'List': {
        const targets = target.items;
        const values = this.iterate(value, target.line);
        if (values.length < targets.length) {
          throw new PyError('ValueError',
            `not enough values to unpack (expected ${targets.length}, got ${values.length})`, target.line);
        }
        if (values.length > targets.length) {
          throw new PyError('ValueError', `too many values to unpack (expected ${targets.length})`, target.line);
        }
        targets.forEach((t, i) => this.assign(t, values[i], scope));
        return;
      }

      case 'Subscript': {
        const container = this.eval(target.value, scope);
        const index = this.eval(target.index, scope);
        if (Array.isArray(container)) {
          const i = this.normalizeIndex(index, container.length, target.line);
          container[i] = value;
          return;
        }
        if (container instanceof PyDict) { container.set(index, value); return; }
        if (typeof container === 'string') {
          throw new PyError('TypeError', "'str' object does not support item assignment", target.line);
        }
        throw new PyError('TypeError', `'${typeName(container)}' object does not support item assignment`, target.line);
      }

      default:
        throw new PyError('SyntaxError', 'cannot assign to this expression', target.line);
    }
  }

  eval(node, scope) {
    this.tick(node.line);
    switch (node.type) {
      case 'Const': return node.value;

      case 'Name': {
        if (scope.has(node.id)) return scope.get(node.id);
        if (this.globals.has(node.id)) return this.globals.get(node.id);
        if (this.builtins.has(node.id)) return this.builtins.get(node.id);
        throw new PyError('NameError', `name '${node.id}' is not defined`, node.line);
      }

      case 'List': return node.items.map((item) => this.eval(item, scope));

      case 'Tuple': return new PyTuple(node.items.map((item) => this.eval(item, scope)));

      case 'Dict': {
        const d = new PyDict();
        node.keys.forEach((k, i) => d.set(this.eval(k, scope), this.eval(node.values[i], scope)));
        return d;
      }

      case 'FString':
        return node.parts.map((part) => (
          part.kind === 'text' ? part.value : applyFormatSpec(this.eval(part.node, scope), part.spec)
        )).join('');

      case 'BinOp':
        return this.binop(node.op, this.eval(node.left, scope), this.eval(node.right, scope), node.line);

      case 'UnaryOp': {
        const v = this.eval(node.operand, scope);
        if (node.op === 'not') return !truthy(v);
        if (node.op === '+') return v;
        if (!isNum(v)) throw new PyError('TypeError', `bad operand type for unary -: '${typeName(v)}'`, node.line);
        return isIntLike(v) ? -toBig(v) : -toNum(v);
      }

      case 'BoolOp': {
        const left = this.eval(node.left, scope);
        if (node.op === 'and') return truthy(left) ? this.eval(node.right, scope) : left;
        return truthy(left) ? left : this.eval(node.right, scope);
      }

      case 'Compare': {
        let left = this.eval(node.left, scope);
        for (let i = 0; i < node.ops.length; i++) {
          const right = this.eval(node.comparators[i], scope);
          if (!this.compare(node.ops[i], left, right, node.line)) return false;
          left = right;
        }
        return true;
      }

      case 'IfExp':
        return truthy(this.eval(node.test, scope))
          ? this.eval(node.body, scope)
          : this.eval(node.orelse, scope);

      case 'Call': return this.evalCall(node, scope);

      case 'Attribute': {
        const obj = this.eval(node.value, scope);
        return this.getAttribute(obj, node.attr, node.line);
      }

      case 'Subscript': {
        const container = this.eval(node.value, scope);
        return this.subscript(container, this.eval(node.index, scope), node.line);
      }

      case 'Slice': {
        const container = this.eval(node.value, scope);
        return this.slice(
          container,
          node.lower ? this.eval(node.lower, scope) : null,
          node.upper ? this.eval(node.upper, scope) : null,
          node.step ? this.eval(node.step, scope) : null,
          node.line,
        );
      }

      default:
        throw new PyError('SyntaxError', `cannot evaluate ${node.type}`, node.line);
    }
  }

  evalCall(node, scope) {
    const args = node.args.map((a) => this.eval(a, scope));
    const kwargs = new Map();
    for (const kw of node.keywords ?? []) kwargs.set(kw.name, this.eval(kw.node, scope));
    if (node.func.type === 'Attribute') {
      const obj = this.eval(node.func.value, scope);
      return this.callMethod(obj, node.func.attr, args, kwargs, node.line);
    }
    const func = this.eval(node.func, scope);
    return this.callValue(func, args, kwargs, node.line);
  }

  callValue(func, args, kwargs, line) {
    kwargs = kwargs ?? new Map();
    if (func instanceof PyBuiltin) return func.fn(args, kwargs, line);
    if (!(func instanceof PyFunction)) {
      throw new PyError('TypeError', `'${typeName(func)}' object is not callable`, line);
    }
    if (args.length > func.params.length) {
      throw new PyError('TypeError',
        `${func.name}() takes ${func.params.length} positional argument${func.params.length === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`,
        line);
    }
    if (++this.depth > MAX_DEPTH) {
      this.depth--;
      throw new PyError('RecursionError', 'maximum recursion depth exceeded', line);
    }
    const local = new Map();
    try {
      const missing = [];
      func.params.forEach((p, i) => {
        if (i < args.length) {
          if (kwargs.has(p)) {
            throw new PyError('TypeError', `${func.name}() got multiple values for argument '${p}'`, line);
          }
          local.set(p, args[i]);
        } else if (kwargs.has(p)) {
          local.set(p, kwargs.get(p));
        } else if (func.defaults[i] !== undefined) {
          local.set(p, func.defaults[i]);
        } else {
          missing.push(p);
        }
      });
      if (missing.length > 0) {
        const names = missing.map((p) => `'${p}'`);
        const listed = names.length === 1
          ? names[0]
          : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
        throw new PyError('TypeError',
          `${func.name}() missing ${missing.length} required positional argument${missing.length === 1 ? '' : 's'}: ${listed}`,
          line);
      }
      for (const key of kwargs.keys()) {
        if (!func.params.includes(key)) {
          throw new PyError('TypeError', `${func.name}() got an unexpected keyword argument '${key}'`, line);
        }
      }
      const signal = this.execBlock(func.body, local);
      return signal instanceof ReturnSignal ? signal.value : null;
    } finally {
      this.depth--;
    }
  }

  compare(op, a, b, line) {
    switch (op) {
      case '==': return pyEqual(a, b);
      case '!=': return !pyEqual(a, b);
      case 'is': return a === b || (a === null && b === null);
      case 'is not': return !(a === b || (a === null && b === null));
      case 'in': return this.contains(b, a, line);
      case 'not in': return !this.contains(b, a, line);
    }
    if (isNum(a) && isNum(b)) {
      const c = numCompare(a, b);
      return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
    }
    if (typeof a === 'string' && typeof b === 'string') {
      const c = a < b ? -1 : a > b ? 1 : 0;
      return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (!pyEqual(a[i], b[i])) return this.compare(op, a[i], b[i], line);
      }
      return this.compare(op, BigInt(a.length), BigInt(b.length), line);
    }
    throw new PyError('TypeError',
      `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`, line);
  }

  contains(container, item, line) {
    if (typeof container === 'string') {
      if (typeof item !== 'string') {
        throw new PyError('TypeError', `'in <string>' requires string as left operand, not ${typeName(item)}`, line);
      }
      return container.includes(item);
    }
    if (Array.isArray(container)) return container.some((x) => pyEqual(x, item));
    if (container instanceof PyTuple) return container.items.some((x) => pyEqual(x, item));
    if (container instanceof PyDict) return container.has(item);
    if (container instanceof PyRange) return container.toArray().some((x) => pyEqual(x, item));
    throw new PyError('TypeError', `argument of type '${typeName(container)}' is not iterable`, line);
  }

  binop(op, a, b, line) {
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (typeof a === 'string' || typeof b === 'string') {
        if (isNum(a) || isNum(b)) {
          throw new PyError('TypeError',
            typeof a === 'string'
              ? `can only concatenate str (not "${typeName(b)}") to str`
              : `unsupported operand type(s) for +: '${typeName(a)}' and 'str'`,
            line);
        }
      }
      if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple([...a.items, ...b.items]);
    }
    if (op === '*') {
      if (typeof a === 'string' && isIntLike(b)) return toBig(b) > 0n ? a.repeat(Number(toBig(b))) : '';
      if (isIntLike(a) && typeof b === 'string') return toBig(a) > 0n ? b.repeat(Number(toBig(a))) : '';
      if (Array.isArray(a) && isIntLike(b)) {
        const n = Number(toBig(b));
        return n > 0 ? Array.from({ length: n }, () => a).flat() : [];
      }
      if (isIntLike(a) && Array.isArray(b)) {
        const n = Number(toBig(a));
        return n > 0 ? Array.from({ length: n }, () => b).flat() : [];
      }
    }
    if (op === '%' && typeof a === 'string') {
      throw new NotSupportedError('%-formatting (use an f-string instead)', line);
    }

    if (!isNum(a) || !isNum(b)) {
      throw new PyError('TypeError',
        `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`, line);
    }

    const bothInt = isIntLike(a) && isIntLike(b);
    switch (op) {
      case '+': return bothInt ? toBig(a) + toBig(b) : toNum(a) + toNum(b);
      case '-': return bothInt ? toBig(a) - toBig(b) : toNum(a) - toNum(b);
      case '*': return bothInt ? toBig(a) * toBig(b) : toNum(a) * toNum(b);
      case '/': {
        if (toNum(b) === 0) throw new PyError('ZeroDivisionError', 'division by zero', line);
        return toNum(a) / toNum(b);
      }
      case '//': {
        if (bothInt) return floorDivBig(toBig(a), toBig(b));
        if (toNum(b) === 0) throw new PyError('ZeroDivisionError', 'float floor division by zero', line);
        return Math.floor(toNum(a) / toNum(b));
      }
      case '%': {
        if (bothInt) return modBig(toBig(a), toBig(b));
        if (toNum(b) === 0) throw new PyError('ZeroDivisionError', 'float modulo', line);
        const r = toNum(a) % toNum(b);
        return r !== 0 && (r < 0) !== (toNum(b) < 0) ? r + toNum(b) : r;
      }
      case '**': {
        if (bothInt && toBig(b) >= 0n) return toBig(a) ** toBig(b);
        return Math.pow(toNum(a), toNum(b));
      }
      default:
        throw new PyError('SyntaxError', `unknown operator ${op}`, line);
    }
  }

  normalizeIndex(index, length, line) {
    if (!isIntLike(index)) {
      throw new PyError('TypeError', `list indices must be integers, not ${typeName(index)}`, line);
    }
    let i = Number(toBig(index));
    if (i < 0) i += length;
    if (i < 0 || i >= length) throw new PyError('IndexError', 'list index out of range', line);
    return i;
  }

  subscript(container, index, line) {
    if (typeof container === 'string') {
      if (!isIntLike(index)) {
        throw new PyError('TypeError', `string indices must be integers, not ${typeName(index)}`, line);
      }
      let i = Number(toBig(index));
      if (i < 0) i += container.length;
      if (i < 0 || i >= container.length) throw new PyError('IndexError', 'string index out of range', line);
      return container[i];
    }
    if (Array.isArray(container)) return container[this.normalizeIndex(index, container.length, line)];
    if (container instanceof PyTuple) return container.items[this.normalizeIndex(index, container.items.length, line)];
    if (container instanceof PyDict) {
      if (!container.has(index)) throw new PyError('KeyError', pyRepr(index), line);
      return container.get(index);
    }
    if (container instanceof PyRange) {
      const arr = container.toArray();
      return arr[this.normalizeIndex(index, arr.length, line)];
    }
    throw new PyError('TypeError', `'${typeName(container)}' object is not subscriptable`, line);
  }

  slice(container, lower, upper, step, line) {
    const isString = typeof container === 'string';
    const isTuple = container instanceof PyTuple;
    let items;
    if (isString) items = [...container];
    else if (Array.isArray(container)) items = container;
    else if (isTuple) items = container.items;
    else if (container instanceof PyRange) items = container.toArray();
    else throw new PyError('TypeError', `'${typeName(container)}' object is not subscriptable`, line);

    const n = items.length;
    const stepNum = step === null ? 1 : Number(toBig(step));
    if (stepNum === 0) throw new PyError('ValueError', 'slice step cannot be zero', line);

    const clamp = (v, def, lowBound, highBound) => {
      if (v === null) return def;
      let x = Number(toBig(v));
      if (x < 0) x += n;
      return Math.min(Math.max(x, lowBound), highBound);
    };

    const out = [];
    if (stepNum > 0) {
      const start = clamp(lower, 0, 0, n);
      const stop = clamp(upper, n, 0, n);
      for (let i = start; i < stop; i += stepNum) out.push(items[i]);
    } else {
      const start = clamp(lower, n - 1, -1, n - 1);
      const stop = clamp(upper, -1, -1, n);
      for (let i = start; i > stop; i += stepNum) out.push(items[i]);
    }
    if (isString) return out.join('');
    if (isTuple) return new PyTuple(out);
    return out;
  }

  iterate(value, line) {
    if (typeof value === 'string') return [...value];
    if (Array.isArray(value)) return [...value];
    if (value instanceof PyTuple) return [...value.items];
    if (value instanceof PyRange) return value.toArray();
    if (value instanceof PyDict) return value.keys();
    throw new PyError('TypeError', `'${typeName(value)}' object is not iterable`, line);
  }

  getAttribute(obj, attr, line) {
    const table = METHODS[typeName(obj)];
    if (table && table[attr]) {
      return new PyBuiltin(attr, (args, kwargs, l) => table[attr](this, obj, args, kwargs, l ?? line));
    }
    throw new PyError('AttributeError', `'${typeName(obj)}' object has no attribute '${attr}'`, line);
  }

  callMethod(obj, name, args, kwargs, line) {
    const table = METHODS[typeName(obj)];
    if (!table || !table[name]) {
      throw new PyError('AttributeError', `'${typeName(obj)}' object has no attribute '${name}'`, line);
    }
    return table[name](this, obj, args, kwargs ?? new Map(), line);
  }
}

// ---------------------------------------------------------------------------
// Builtins
// ---------------------------------------------------------------------------

function expectArgs(name, args, min, max, line) {
  if (args.length < min || args.length > (max ?? min)) {
    throw new PyError('TypeError',
      `${name}() takes ${max === undefined || max === min ? min : `${min} to ${max}`} argument${min === 1 ? '' : 's'} but ${args.length} were given`,
      line);
  }
}

// Python's sort/sorted take `reverse` keyword-only; passing it positionally is
// a TypeError, and the game must reject it the same way.
function keywordOnly(name, args, kwargs, allowed, line) {
  for (const key of kwargs.keys()) {
    if (!allowed.includes(key)) {
      throw new PyError('TypeError', `${name}() got an unexpected keyword argument '${key}'`, line);
    }
  }
}

function noKeywords(name, kwargs, line) {
  if (kwargs.size > 0) {
    throw new PyError('TypeError', `${name}() takes no keyword arguments`, line);
  }
}

function makeBuiltins(interp) {
  const b = new Map();
  const def = (name, fn) => b.set(name, new PyBuiltin(name, fn));

  def('print', (args, kwargs, line) => {
    keywordOnly('print', args, kwargs, ['sep', 'end'], line);
    const sep = kwargs.has('sep') ? pyStr(kwargs.get('sep')) : ' ';
    const end = kwargs.has('end') ? pyStr(kwargs.get('end')) : '\n';
    interp.write(args.map(pyStr).join(sep), end);
    return null;
  });

  def('len', (args, kwargs, line) => {
    expectArgs('len', args, 1, 1, line);
    const v = args[0];
    if (typeof v === 'string') return BigInt(v.length);
    if (Array.isArray(v)) return BigInt(v.length);
    if (v instanceof PyTuple) return BigInt(v.items.length);
    if (v instanceof PyDict) return BigInt(v.size);
    if (v instanceof PyRange) return v.length;
    throw new PyError('TypeError', `object of type '${typeName(v)}' has no len()`, line);
  });

  def('range', (args, kwargs, line) => {
    expectArgs('range', args, 1, 3, line);
    const nums = args.map((a) => {
      if (!isIntLike(a)) {
        throw new PyError('TypeError', `'${typeName(a)}' object cannot be interpreted as an integer`, line);
      }
      return toBig(a);
    });
    if (nums.length === 1) return new PyRange(0n, nums[0], 1n);
    if (nums.length === 2) return new PyRange(nums[0], nums[1], 1n);
    if (nums[2] === 0n) throw new PyError('ValueError', 'range() arg 3 must not be zero', line);
    return new PyRange(nums[0], nums[1], nums[2]);
  });

  def('str', (args, kwargs, line) => {
    expectArgs('str', args, 0, 1, line);
    return args.length === 0 ? '' : pyStr(args[0]);
  });

  def('int', (args, kwargs, line) => {
    expectArgs('int', args, 0, 1, line);
    if (args.length === 0) return 0n;
    const v = args[0];
    if (isIntLike(v)) return toBig(v);
    if (typeof v === 'number') return BigInt(Math.trunc(v));
    if (typeof v === 'string') {
      const t = v.trim();
      if (!/^[+-]?\d+$/.test(t)) {
        throw new PyError('ValueError', `invalid literal for int() with base 10: ${pyRepr(v)}`, line);
      }
      return BigInt(t);
    }
    throw new PyError('TypeError', `int() argument must be a string or a number, not '${typeName(v)}'`, line);
  });

  def('float', (args, kwargs, line) => {
    expectArgs('float', args, 0, 1, line);
    if (args.length === 0) return 0.0;
    const v = args[0];
    if (isNum(v)) return toNum(v);
    if (typeof v === 'string') {
      const t = v.trim();
      const n = Number(t);
      if (t === '' || Number.isNaN(n)) {
        throw new PyError('ValueError', `could not convert string to float: ${pyRepr(v)}`, line);
      }
      return n;
    }
    throw new PyError('TypeError', `float() argument must be a string or a number, not '${typeName(v)}'`, line);
  });

  def('bool', (args, kwargs, line) => {
    expectArgs('bool', args, 0, 1, line);
    return args.length === 0 ? false : truthy(args[0]);
  });

  def('list', (args, kwargs, line) => {
    expectArgs('list', args, 0, 1, line);
    return args.length === 0 ? [] : interp.iterate(args[0], line);
  });

  def('tuple', (args, kwargs, line) => {
    expectArgs('tuple', args, 0, 1, line);
    return new PyTuple(args.length === 0 ? [] : interp.iterate(args[0], line));
  });

  def('dict', (args, kwargs, line) => {
    expectArgs('dict', args, 0, 1, line);
    if (args.length === 0) return new PyDict();
    const d = new PyDict();
    for (const pair of interp.iterate(args[0], line)) {
      const items = pair instanceof PyTuple ? pair.items : Array.isArray(pair) ? pair : null;
      if (!items || items.length !== 2) {
        throw new PyError('ValueError', 'dictionary update sequence element has length != 2', line);
      }
      d.set(items[0], items[1]);
    }
    return d;
  });

  def('sum', (args, kwargs, line) => {
    expectArgs('sum', args, 1, 2, line);
    let total = args.length > 1 ? args[1] : 0n;
    for (const item of interp.iterate(args[0], line)) {
      if (!isNum(item)) {
        throw new PyError('TypeError', `unsupported operand type(s) for +: 'int' and '${typeName(item)}'`, line);
      }
      total = interp.binop('+', total, item, line);
    }
    return total;
  });

  const extremum = (name, wantMax) => def(name, (args, kwargs, line) => {
    if (args.length === 0) throw new PyError('TypeError', `${name}() expected at least 1 argument, got 0`, line);
    const items = args.length === 1 ? interp.iterate(args[0], line) : args;
    if (items.length === 0) throw new PyError('ValueError', `${name}() arg is an empty sequence`, line);
    let best = items[0];
    for (const item of items.slice(1)) {
      if (interp.compare(wantMax ? '>' : '<', item, best, line)) best = item;
    }
    return best;
  });
  extremum('max', true);
  extremum('min', false);

  def('sorted', (args, kwargs, line) => {
    expectArgs('sorted', args, 1, 1, line);
    keywordOnly('sorted', args, kwargs, ['reverse'], line);
    const copy = [...interp.iterate(args[0], line)];
    copy.sort((x, y) => (interp.compare('<', x, y, line) ? -1 : interp.compare('<', y, x, line) ? 1 : 0));
    if (truthy(kwargs.get('reverse') ?? false)) copy.reverse();
    return copy;
  });

  def('reversed', (args, kwargs, line) => {
    expectArgs('reversed', args, 1, 1, line);
    return [...interp.iterate(args[0], line)].reverse();
  });

  def('abs', (args, kwargs, line) => {
    expectArgs('abs', args, 1, 1, line);
    const v = args[0];
    if (!isNum(v)) throw new PyError('TypeError', `bad operand type for abs(): '${typeName(v)}'`, line);
    if (isIntLike(v)) { const n = toBig(v); return n < 0n ? -n : n; }
    return Math.abs(toNum(v));
  });

  def('round', (args, kwargs, line) => {
    expectArgs('round', args, 1, 2, line);
    const v = args[0];
    if (!isNum(v)) throw new PyError('TypeError', `type ${typeName(v)} doesn't define __round__ method`, line);
    const digits = args.length > 1 ? Number(toBig(args[1])) : 0;
    if (isIntLike(v) && digits >= 0) return toBig(v);
    const x = toNum(v);
    const factor = 10 ** digits;
    const scaled = x * factor;
    // Python rounds halves to even; JS Math.round always rounds up.
    let r = Math.round(scaled);
    if (Math.abs(scaled % 1) === 0.5 && r % 2 !== 0) r -= 1;
    const result = r / factor;
    return digits <= 0 && args.length <= 1 ? BigInt(Math.trunc(result)) : result;
  });

  def('type', (args, kwargs, line) => {
    expectArgs('type', args, 1, 1, line);
    return `<class '${typeName(args[0])}'>`;
  });

  def('enumerate', (args, kwargs, line) => {
    expectArgs('enumerate', args, 1, 2, line);
    const start = args.length > 1 ? toBig(args[1]) : 0n;
    return interp.iterate(args[0], line).map((v, i) => new PyTuple([start + BigInt(i), v]));
  });

  def('zip', (args, kwargs, line) => {
    const seqs = args.map((a) => interp.iterate(a, line));
    const n = seqs.length === 0 ? 0 : Math.min(...seqs.map((s) => s.length));
    return Array.from({ length: n }, (_, i) => new PyTuple(seqs.map((s) => s[i])));
  });

  def('input', (args, kwargs, line) => {
    throw new NotSupportedError('input() (the game has no keyboard prompt)', line);
  });

  return b;
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

function needStr(name, v, line, position = 'argument') {
  if (typeof v !== 'string') {
    throw new PyError('TypeError', `${name}() ${position} must be str, not ${typeName(v)}`, line);
  }
  return v;
}

const STR_METHODS = {
  upper: (i, s, a, kw, line) => s.toUpperCase(),
  lower: (i, s, a, kw, line) => s.toLowerCase(),
  strip: (i, s, a, kw, line) => (a.length ? trimChars(s, needStr('strip', a[0]), true, true) : s.trim()),
  lstrip: (i, s, a, kw, line) => (a.length ? trimChars(s, needStr('lstrip', a[0]), true, false) : s.replace(/^\s+/, '')),
  rstrip: (i, s, a, kw, line) => (a.length ? trimChars(s, needStr('rstrip', a[0]), false, true) : s.replace(/\s+$/, '')),
  capitalize: (i, s, a, kw, line) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s),
  title: (i, s, a, kw, line) => s.replace(/[A-Za-z]+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  split: (i, s, a, kw, line) => {
    if (a.length === 0) return s.split(/\s+/).filter((x) => x.length > 0);
    return s.split(needStr('split', a[0], line));
  },
  join: (i, s, a, kw, line) => {
    expectArgs('join', a, 1, 1, line);
    return i.iterate(a[0], line).map((x) => needStr('join', x, line, 'items')).join(s);
  },
  replace: (i, s, a, kw, line) => {
    expectArgs('replace', a, 2, 2, line);
    return s.split(needStr('replace', a[0], line)).join(needStr('replace', a[1], line));
  },
  startswith: (i, s, a, kw, line) => s.startsWith(needStr('startswith', a[0], line)),
  endswith: (i, s, a, kw, line) => s.endsWith(needStr('endswith', a[0], line)),
  find: (i, s, a, kw, line) => BigInt(s.indexOf(needStr('find', a[0], line))),
  count: (i, s, a, kw, line) => {
    const sub = needStr('count', a[0], line);
    if (sub === '') return BigInt(s.length + 1);
    return BigInt(s.split(sub).length - 1);
  },
  index: (i, s, a, kw, line) => {
    const at = s.indexOf(needStr('index', a[0], line));
    if (at === -1) throw new PyError('ValueError', 'substring not found', line);
    return BigInt(at);
  },
  isdigit: (i, s, a, kw, line) => s.length > 0 && /^\d+$/.test(s),
  isalpha: (i, s, a, kw, line) => s.length > 0 && /^[A-Za-z]+$/.test(s),
  isupper: (i, s, a, kw, line) => /[A-Za-z]/.test(s) && s === s.toUpperCase(),
  islower: (i, s, a, kw, line) => /[A-Za-z]/.test(s) && s === s.toLowerCase(),
};

function trimChars(s, chars, left, right) {
  let start = 0;
  let end = s.length;
  if (left) while (start < end && chars.includes(s[start])) start++;
  if (right) while (end > start && chars.includes(s[end - 1])) end--;
  return s.slice(start, end);
}

const LIST_METHODS = {
  append: (i, l, a, kw, line) => { expectArgs('append', a, 1, 1, line); l.push(a[0]); return null; },
  extend: (i, l, a, kw, line) => { l.push(...i.iterate(a[0], line)); return null; },
  insert: (i, l, a, kw, line) => {
    expectArgs('insert', a, 2, 2, line);
    let at = Number(toBig(a[0]));
    if (at < 0) at = Math.max(0, l.length + at);
    l.splice(Math.min(at, l.length), 0, a[1]);
    return null;
  },
  pop: (i, l, a, kw, line) => {
    if (l.length === 0) throw new PyError('IndexError', 'pop from empty list', line);
    if (a.length === 0) return l.pop();
    const at = i.normalizeIndex(a[0], l.length, line);
    return l.splice(at, 1)[0];
  },
  remove: (i, l, a, kw, line) => {
    expectArgs('remove', a, 1, 1, line);
    const at = l.findIndex((x) => pyEqual(x, a[0]));
    if (at === -1) throw new PyError('ValueError', 'list.remove(x): x not in list', line);
    l.splice(at, 1);
    return null;
  },
  index: (i, l, a, kw, line) => {
    const at = l.findIndex((x) => pyEqual(x, a[0]));
    if (at === -1) throw new PyError('ValueError', `${pyRepr(a[0])} is not in list`, line);
    return BigInt(at);
  },
  count: (i, l, a, kw, line) => BigInt(l.filter((x) => pyEqual(x, a[0])).length),
  sort: (i, l, a, kw, line) => {
    if (a.length > 0) throw new PyError('TypeError', 'sort() takes no positional arguments', line);
    keywordOnly('sort', a, kw, ['reverse'], line);
    l.sort((x, y) => (i.compare('<', x, y, line) ? -1 : i.compare('<', y, x, line) ? 1 : 0));
    if (truthy(kw.get('reverse') ?? false)) l.reverse();
    return null;
  },
  reverse: (i, l, a, kw, line) => { l.reverse(); return null; },
  clear: (i, l, a, kw, line) => { l.length = 0; return null; },
  copy: (i, l, a, kw, line) => [...l],
};

const DICT_METHODS = {
  keys: (i, d, a, kw, line) => d.keys(),
  values: (i, d, a, kw, line) => d.values(),
  items: (i, d, a, kw, line) => d.entries().map(([k, v]) => new PyTuple([k, v])),
  get: (i, d, a, kw, line) => {
    expectArgs('get', a, 1, 2, line);
    return d.has(a[0]) ? d.get(a[0]) : (a.length > 1 ? a[1] : null);
  },
  pop: (i, d, a, kw, line) => {
    if (!d.has(a[0])) {
      if (a.length > 1) return a[1];
      throw new PyError('KeyError', pyRepr(a[0]), line);
    }
    const v = d.get(a[0]);
    d.delete(a[0]);
    return v;
  },
  update: (i, d, a, kw, line) => {
    if (!(a[0] instanceof PyDict)) {
      throw new PyError('TypeError', `update() argument must be a dict, not ${typeName(a[0])}`, line);
    }
    for (const [k, v] of a[0].entries()) d.set(k, v);
    return null;
  },
  clear: (i, d, a, kw, line) => { d.map.clear(); return null; },
  copy: (i, d, a, kw, line) => PyDict.from(d.entries()),
};

const TUPLE_METHODS = {
  count: (i, t, a, kw, line) => BigInt(t.items.filter((x) => pyEqual(x, a[0])).length),
  index: (i, t, a, kw, line) => {
    const at = t.items.findIndex((x) => pyEqual(x, a[0]));
    if (at === -1) throw new PyError('ValueError', 'tuple.index(x): x not in tuple', line);
    return BigInt(at);
  },
};

const METHODS = {
  str: STR_METHODS,
  list: LIST_METHODS,
  dict: DICT_METHODS,
  tuple: TUPLE_METHODS,
};

/** Convenience wrapper: run a program and return its result. */
export function runPython(source) {
  return new Interpreter().run(source);
}
