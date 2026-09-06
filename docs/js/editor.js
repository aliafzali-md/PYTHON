// The code editor, tuned for typing Python on an iPhone.
//
// Two problems this solves: iOS buries every character Python needs behind
// modifier layers, and iOS autocorrect happily rewrites code as prose.

const INDENT = '    ';

const KEYS = [
  { label: '⇥', insert: INDENT, title: 'Indent' },
  { label: '⇤', dedent: true, title: 'Outdent' },
  { label: ':', insert: ':' },
  { label: '"', insert: '"' },
  { label: "'", insert: "'" },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '[', insert: '[' },
  { label: ']', insert: ']' },
  { label: '{', insert: '{' },
  { label: '}', insert: '}' },
  { label: '=', insert: '=' },
  { label: '_', insert: '_' },
  { label: '#', insert: '#' },
  { label: '%', insert: '%' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '*', insert: '*' },
  { label: '<', insert: '<' },
  { label: '>', insert: '>' },
];

export function createEditor(value) {
  const wrap = document.createElement('div');
  wrap.className = 'editor-wrap';

  const textarea = document.createElement('textarea');
  textarea.id = 'code';
  textarea.value = value;
  textarea.rows = 8;
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('aria-label', 'Python code editor');

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      autoIndent(textarea);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      insertAtCursor(textarea, INDENT);
    }
  });

  wrap.append(textarea);
  return { wrap, textarea };
}

/** Continue the current indentation, and go one level deeper after a colon. */
function autoIndent(textarea) {
  const { value, selectionStart } = textarea;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const line = value.slice(lineStart, selectionStart);
  const current = line.match(/^[ \t]*/)[0];
  const deeper = line.trimEnd().endsWith(':') ? INDENT : '';
  insertAtCursor(textarea, '\n' + current + deeper);
}

function insertAtCursor(textarea, text) {
  const { selectionStart, selectionEnd, value } = textarea;
  textarea.value = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  const at = selectionStart + text.length;
  textarea.setSelectionRange(at, at);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function dedent(textarea) {
  const { value, selectionStart } = textarea;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const line = value.slice(lineStart, selectionStart);
  const leading = line.match(/^[ \t]*/)[0];
  if (leading.length === 0) return;
  const remove = Math.min(leading.length % 4 || 4, leading.length);
  textarea.value = value.slice(0, lineStart) + value.slice(lineStart + remove);
  const at = selectionStart - remove;
  textarea.setSelectionRange(at, at);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * The toolbar rides above the on-screen keyboard. visualViewport is the only
 * reliable way to know where the keyboard actually is on iOS.
 */
export function mountKeybar(textarea) {
  const bar = document.getElementById('keybar');
  bar.replaceChildren();

  for (const key of KEYS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = key.label;
    if (key.title) button.title = key.title;
    if (key.label.length > 1) button.className = 'wide';
    // pointerdown + preventDefault keeps focus (and the keyboard) in place.
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      textarea.focus();
      if (key.dedent) dedent(textarea);
      else insertAtCursor(textarea, key.insert);
    });
    bar.append(button);
  }

  const viewport = window.visualViewport;
  const reposition = () => {
    if (!viewport) return;
    const overlap = window.innerHeight - (viewport.height + viewport.offsetTop);
    bar.style.transform = `translateY(${-Math.max(0, overlap)}px)`;
  };

  const show = () => { bar.hidden = false; reposition(); };
  const hide = () => { bar.hidden = true; };

  textarea.addEventListener('focus', show);
  textarea.addEventListener('blur', hide);
  viewport?.addEventListener('resize', reposition);
  viewport?.addEventListener('scroll', reposition);

  return () => {
    viewport?.removeEventListener('resize', reposition);
    viewport?.removeEventListener('scroll', reposition);
    bar.hidden = true;
    bar.replaceChildren();
  };
}
