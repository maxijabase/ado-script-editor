import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import { keymap, Decoration, MatchDecorator, ViewPlugin } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { StreamLanguage } from '@codemirror/language';
import { autocompletion, completeAnyWord, completeFromList, snippetCompletion } from '@codemirror/autocomplete';
import { powerShell } from '@codemirror/legacy-modes/mode/powershell';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { python } from '@codemirror/legacy-modes/mode/python';
import { oneDark } from '@codemirror/theme-one-dark';
import { languages } from './languages.js';

const LABEL = /^\s*(inline\s+)?script\s*\*?\s*$/i;
const DEFAULTS = { fontSize: 13, theme: 'auto', wrap: false };
const MODES = { powershell: powerShell, shell, python };
const setNativeValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
const editors = new Set();
let settings = DEFAULTS;

// ---------- page inspection ----------

function labelOf(ta) {
  const byId = ta.getAttribute('aria-labelledby');
  if (byId) return byId.trim().split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  if (ta.getAttribute('aria-label')) return ta.getAttribute('aria-label');
  for (let el = ta.parentElement, i = 0; el && i < 6; el = el.parentElement, i++) {
    if (el.querySelectorAll('textarea').length > 1) break;
    const label = el.querySelector('label');
    if (label) return label.textContent;
  }
  return '';
}

function taskPanel(ta) {
  for (let el = ta.parentElement; el; el = el.parentElement) if (el.querySelector('.task-type-label')) return el;
  return null;
}

function fieldValue(panel, labelText) {
  const label = [...panel.querySelectorAll('label')].find((l) => l.textContent.trim() === labelText);
  const field = label?.closest('.input-field-component');
  return field?.querySelector('input')?.value || field?.textContent || '';
}

function detectLanguage(ta) {
  const panel = taskPanel(ta);
  if (!panel) return 'powershell';
  const type = panel.querySelector('.task-type-label').firstChild?.textContent ?? '';
  if (/powershell/i.test(type)) return 'powershell';
  if (/azure cli/i.test(type)) return /powershell/i.test(fieldValue(panel, 'Script Type')) ? 'powershell' : 'shell';
  if (/python/i.test(type)) return 'python';
  if (/bash|shell|ssh|command line/i.test(type)) return 'shell';
  return 'powershell';
}

function pageIsDark() {
  const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

const isDark = () => (settings.theme === 'auto' ? pageIsDark() : settings.theme === 'dark');

// ---------- editor extensions ----------

const adoVariables = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decorations = this.matcher.createDeco(view); }
    update(u) { this.decorations = this.matcher.updateDeco(u, this.decorations); }
    matcher = new MatchDecorator({ regexp: /\$\([\w.\-]+\)/g, decoration: Decoration.mark({ class: 'cm-ado-var' }) });
  },
  { decorations: (p) => p.decorations },
);

function languageExtension(id) {
  const lang = languages[id];
  return [
    StreamLanguage.define(MODES[id]),
    EditorState.languageData.of(() => [{ wordChars: lang.wordChars }]),
    autocompletion({ override: [completeFromList(lang.completions.map((c) => (c.snippet ? snippetCompletion(c.snippet, c) : c))), completeAnyWord] }),
  ];
}

const themeExtension = (dark) => [
  dark ? oneDark : [],
  EditorView.theme({
    '&': dark ? {} : { backgroundColor: '#fff', color: '#1f1f1f' },
    '.cm-ado-var': { color: dark ? '#e5c07b' : '#a0522d', textDecoration: 'underline dotted', textUnderlineOffset: '3px' },
  }, { dark }),
];

const fontExtension = (size) => EditorView.theme({
  '&': { height: '100%', fontSize: `${size}px` },
  '.cm-scroller': { fontFamily: 'Consolas, "Cascadia Code", "Cascadia Mono", Menlo, monospace' },
});

// ---------- UI ----------

const css = `
.sea-wrap { display:flex; flex-direction:column; flex:1 1 auto; width:100%; min-width:0; contain:inline-size; }
.sea-bar { display:flex; align-items:center; gap:8px; padding:3px 6px; font:12px 'Segoe UI', sans-serif; border:1px solid var(--sea-border); border-bottom:0; border-radius:2px 2px 0 0; background:var(--sea-bar-bg); color:var(--sea-fg); }
.sea-bar .sea-spacer { flex:1; }
.sea-bar .sea-over { color:#e74c3c; font-weight:600; }
.sea-bar button { font:inherit; color:inherit; background:none; border:1px solid transparent; border-radius:2px; padding:1px 6px; cursor:pointer; }
.sea-bar button:hover { border-color:var(--sea-border); }
.sea-host { height:400px; min-height:120px; resize:vertical; overflow:hidden; border:1px solid var(--sea-border); }
.sea-wrap.sea-full { position:fixed; inset:24px; width:auto;z-index:1000000; box-shadow:0 8px 40px rgba(0,0,0,.5); }
.sea-wrap.sea-full .sea-host { flex:1; height:auto; resize:none; }
.sea-wrap.sea-plain .sea-host { display:none; }
`;

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

function button(text, title, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

function paintChrome(wrap) {
  const dark = isDark();
  wrap.style.setProperty('--sea-border', dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.2)');
  wrap.style.setProperty('--sea-bar-bg', dark ? '#21252b' : '#f3f3f3');
  wrap.style.setProperty('--sea-fg', dark ? '#c8ccd4' : '#333');
}

// ---------- attach ----------

function attach(ta) {
  ta.dataset.adoScriptEditor = '1';
  // Mount above the whole Fluent TextField: its inner field group is a flex row, so a sibling of the
  // textarea would sit beside it in plain-text mode.
  const field = ta.closest('.ms-TextField') ?? ta;
  let synced = ta.value;
  let langId = detectLanguage(ta);
  const comp = { lang: new Compartment(), theme: new Compartment(), font: new Compartment(), wrap: new Compartment() };

  const wrap = document.createElement('div');
  wrap.className = 'sea-wrap';
  const bar = document.createElement('div');
  bar.className = 'sea-bar';
  const langBadge = document.createElement('span');
  const counter = document.createElement('span');
  const spacer = document.createElement('span');
  spacer.className = 'sea-spacer';
  const host = document.createElement('div');
  host.className = 'sea-host';

  const setFull = (on) => {
    wrap.classList.toggle('sea-full', on);
    fullBtn.textContent = on ? 'Exit full screen' : 'Full screen';
    view.requestMeasure();
  };
  const fullBtn = button('Full screen', 'Edit in full screen (Esc to exit)', () => setFull(!wrap.classList.contains('sea-full')));
  const plainBtn = button('Plain text', 'Switch back to the original text box', () => {
    const plain = wrap.classList.toggle('sea-plain');
    field.style.display = plain ? '' : 'none';
    plainBtn.textContent = plain ? 'Code editor' : 'Plain text';
    fullBtn.hidden = plain;
    if (plain) setFull(false);
  });

  bar.append(langBadge, spacer, counter, fullBtn, plainBtn);
  wrap.append(bar, host);
  field.insertAdjacentElement('beforebegin', wrap);
  field.style.display = 'none';

  const refreshBar = () => {
    langBadge.textContent = languages[langId].name;
    const max = ta.maxLength;
    const len = view.state.doc.length;
    counter.hidden = !(max > 0);
    counter.textContent = `${len.toLocaleString()} / ${max.toLocaleString()}`;
    counter.className = len > max ? 'sea-over' : '';
    counter.title = len > max ? `Azure DevOps limits this field to ${max} characters` : 'Characters used';
  };

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: ta.value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        Prec.low(keymap.of([{ key: 'Escape', run: () => (wrap.classList.contains('sea-full') ? (setFull(false), true) : false) }])),
        comp.lang.of(languageExtension(langId)),
        comp.theme.of(themeExtension(isDark())),
        comp.font.of(fontExtension(settings.fontSize)),
        comp.wrap.of(settings.wrap ? EditorView.lineWrapping : []),
        adoVariables,
        EditorState.readOnly.of(ta.readOnly || ta.disabled),
        EditorView.updateListener.of((u) => {
          if (!u.docChanged) return;
          refreshBar();
          const text = u.state.doc.toString();
          if (text === synced) return;
          synced = text;
          setNativeValue.call(ta, text); // React ignores plain .value writes
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }),
      ],
    }),
  });

  const editor = {
    applySettings() {
      paintChrome(wrap);
      view.dispatch({ effects: [
        comp.theme.reconfigure(themeExtension(isDark())),
        comp.font.reconfigure(fontExtension(settings.fontSize)),
        comp.wrap.reconfigure(settings.wrap ? EditorView.lineWrapping : []),
      ] });
    },
  };
  editors.add(editor);
  paintChrome(wrap);
  refreshBar();

  // React may reuse this textarea for another task, or remove it; neither fires an event.
  const timer = setInterval(() => {
    if (!ta.isConnected) {
      clearInterval(timer);
      editors.delete(editor);
      view.destroy();
      wrap.remove();
      return;
    }
    if (ta.value !== synced) {
      synced = ta.value;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: synced } });
    }
    const detected = detectLanguage(ta);
    if (detected !== langId) {
      langId = detected;
      view.dispatch({ effects: comp.lang.reconfigure(languageExtension(langId)) });
      refreshBar();
    }
  }, 300);
}

function scan() {
  for (const ta of document.querySelectorAll('textarea:not([data-ado-script-editor])')) {
    if (LABEL.test(labelOf(ta))) attach(ta);
  }
}

chrome.storage.sync.get(DEFAULTS, (stored) => {
  settings = stored;
  injectStyles();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
});

chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = stored;
    editors.forEach((e) => e.applySettings());
  });
});
