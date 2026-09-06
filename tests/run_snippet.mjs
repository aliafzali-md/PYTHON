// Reads Python source on stdin, runs it through the game's interpreter,
// prints the program output (or the error line) on stdout.
import { Interpreter } from '../docs/js/interpreter.js';

let source = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { source += chunk; });
process.stdin.on('end', () => {
  const result = new Interpreter().run(source);
  process.stdout.write(result.output);
  if (!result.ok) process.stdout.write(result.error + '\n');
});
