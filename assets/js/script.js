/* ============================================================
   Kailash Yadav — rybkr.com-style vim UI
   ============================================================ */

/* ---------- DOM refs ---------- */
const html = document.documentElement;
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const backToTop = document.getElementById('backToTop');

const statusMode = document.getElementById('statusMode');
const statusSection = document.getElementById('statusSection');
const statusPath = document.getElementById('statusPath');
const statusPosition = document.getElementById('statusPosition');

const commandWrap = document.getElementById('commandWrap');
const commandInput = document.getElementById('commandInput');
const commandDisplay = document.getElementById('commandDisplay');
const completions = document.getElementById('completions');

const palette = document.getElementById('commandPalette');
const paletteInput = document.getElementById('command-palette-input');
const paletteResults = document.getElementById('commandPaletteResults');

const shortcutsModal = document.getElementById('shortcutsModal');
const emailStatus = document.getElementById('emailStatus');

/* ---------- Sections ---------- */
const sections = Array.from(document.querySelectorAll('.home-section, .page-section'))
  .filter(s => s.id && s.id !== 'about')
  .map(s => s.id);
const HOME_ID = 'home';

function activeSectionId() {
  let best = HOME_ID;
  let bestTop = -Infinity;
  const marker = window.innerHeight * 0.4;
  [...sections, HOME_ID].forEach(id => {
    const el = id === HOME_ID ? document.querySelector('.home-intro') : document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top <= marker && top > bestTop) best = id;
  });
  return best;
}

function fmtPosition() {
  const y = Math.max(0, Math.round(window.scrollY));
  const line = Math.floor(window.scrollY / 28) + 1;
  const section = activeSectionId();
  const total = Math.max(1, Math.round(document.documentElement.scrollHeight - window.innerHeight));
  const pct = Math.min(100, Math.round((window.scrollY / total) * 100));
  return { text: `${line}:${pct}`, section };
}

function updateStatusline() {
  const { text, section } = fmtPosition();
  if (statusPosition) statusPosition.textContent = text;
  if (statusSection) {
    statusSection.textContent = section === HOME_ID ? '~' : section;
  }
  if (statusPath) {
    statusPath.textContent = `~/kailash-yadav${section === HOME_ID ? '' : '/' + section}`;
  }
}

let scrollRaf = null;
function scheduleStatusline() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null;
    updateStatusline();
  });
}

window.addEventListener('scroll', scheduleStatusline, { passive: true });
window.addEventListener('resize', scheduleStatusline);

/* ---------- Theme ---------- */
const stored = (() => { try { return localStorage.getItem('theme'); } catch (_) { return null; } })();
if (stored) html.setAttribute('data-theme', stored);
else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) html.setAttribute('data-theme', 'dark');

function currentTheme() {
  return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  try { localStorage.setItem('theme', theme); } catch (_) {}
}

function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

/* ---------- Back to top ---------- */
if (backToTop) {
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Email copy ---------- */
document.querySelectorAll('.home-links button.email-copy, .home-links a.email-copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-email') || 'kailashyadav0411@gmail.com';
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (emailStatus) {
      emailStatus.classList.add('is-visible');
      clearTimeout(btn._t);
      btn._t = setTimeout(() => emailStatus.classList.remove('is-visible'), 1600);
    }
  });
});

/* ---------- Command mode (statusline) ---------- */
const commands = [
  { name: 'home', aliases: ['h'], description: 'Scroll to top', run: () => scrollToId('home') },
  { name: 'projects', aliases: ['proj'], description: 'Scroll to projects', run: () => scrollToId('projects') },
  { name: 'resume', aliases: ['r'], description: 'Scroll to resume', run: () => scrollToId('resume') },
  { name: 'help', aliases: ['?'], description: 'Show keyboard shortcuts', run: openShortcuts },
  { name: 'theme', aliases: ['colorscheme'], description: 'Toggle theme', run: toggleTheme },
  { name: 'top', aliases: ['gg'], description: 'Scroll to top', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  { name: 'bot', aliases: ['G'], description: 'Scroll to bottom', run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }) },
];

function findSectionTop(id) {
  if (!id || id === 'home') return 0;
  const el = document.getElementById(id);
  if (!el) return 0;
  return el.getBoundingClientRect().top + window.scrollY - 80;
}

function scrollToId(id) {
  window.scrollTo({ top: findSectionTop(id), behavior: 'smooth' });
}

function setCommandMode(on) {
  commandWrap.classList.toggle('is-active', on);
  if (on) {
    commandInput.value = '';
    commandInput.focus();
    renderCompletions('');
  } else {
    commandWrap.classList.remove('is-editing');
    completions.hidden = true;
  }
}

function renderCompletions(value) {
  const q = value.replace(/^:/, '').toLowerCase();
  if (!q) { completions.hidden = true; return; }
  const matches = commands.filter(c => c.name.includes(q) || c.aliases.some(a => a.includes(q)));
  if (!matches.length) { completions.hidden = true; return; }
  completions.innerHTML = '';
  matches.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'statusline-completion';
    b.dataset.cmd = c.name;
    b.innerHTML = `<span class="statusline-completion-name">:${c.name}</span><span class="statusline-completion-description">${c.description}</span>`;
    b.addEventListener('click', () => runCommand(c.name));
    completions.appendChild(b);
  });
  completions.hidden = false;
  selectCompletion(0);
}

function runCommand(name) {
  const cmd = commands.find(c => c.name === name);
  if (!cmd) return;
  setCommandMode(false);
  commandWrap.classList.remove('is-active');
  cmd.run();
}

function selectCompletion(index) {
  const items = completions.querySelectorAll('.statusline-completion');
  items.forEach((el, i) => el.classList.toggle('is-selected', i === index));
}

commandInput.addEventListener('input', () => {
  commandWrap.classList.add('is-editing');
  commandDisplay.textContent = ':' + commandInput.value;
  renderCompletions(commandInput.value);
});

commandInput.addEventListener('keydown', (e) => {
  const items = Array.from(completions.querySelectorAll('.statusline-completion'));
  const sel = completions.querySelector('.is-selected');
  const idx = items.indexOf(sel);
  if (e.key === 'Enter') {
    if (sel) { runCommand(sel.dataset.cmd); }
    else {
      const name = commandInput.value.replace(/^:/, '').trim();
      if (name) runCommand(name);
      else setCommandMode(false);
    }
  } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
    e.preventDefault();
    const next = (idx + 1) % items.length;
    selectCompletion(next);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = (idx - 1 + items.length) % items.length;
    selectCompletion(prev);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setCommandMode(false);
  }
});

commandInput.addEventListener('blur', () => {
  if (commandInput.value === '') setCommandMode(false);
});

/* ---------- Command palette / search ---------- */
let paletteMode = 'search'; // 'search' | 'command'

function openPalette(mode) {
  paletteMode = mode || 'search';
  palette.classList.add('open');
  palette.setAttribute('data-mode', paletteMode);
  paletteInput.value = '';
  paletteInput.placeholder = paletteMode === 'command' ? 'Run a command…' : 'Search…';
  renderPalette('');
  setTimeout(() => paletteInput.focus(), 10);
}

function closePalette() {
  palette.classList.remove('open');
}

function renderPalette(value) {
  const q = value.replace(/^:/, '').toLowerCase();
  const isCmd = paletteMode === 'command' || value.startsWith(':');

  paletteResults.innerHTML = '';

  if (isCmd) {
    const list = document.createElement('div');
    list.className = 'command-palette-command-list';
    commands.forEach((c, i) => {
      const show = !q || c.name.includes(q) || c.aliases.some(a => a.includes(q));
      if (!show) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'command-palette-command';
      btn.dataset.cmd = c.name;
      btn.setAttribute('data-idx', i);
      btn.innerHTML = `<span class="command-palette-command-name">:${c.name}</span><span class="command-palette-command-aliases">${c.aliases.join(', ')}</span><span class="command-palette-command-description">${c.description}</span>`;
      btn.addEventListener('click', () => { runPaletteCommand(c.name); });
      list.appendChild(btn);
    });
    paletteResults.appendChild(list);
  } else {
    const items = [
      { title: 'Home', meta: '~/kailash-yadav', section: 'home' },
      { title: 'Projects', meta: 'Projects', section: 'projects' },
      { title: 'Resume', meta: 'Resume', section: 'resume' },
    ];
    let filtered = items;
    if (q) {
      filtered = items.filter(it => it.title.toLowerCase().includes(q) || it.meta.toLowerCase().includes(q));
    }
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'command-palette-empty';
      empty.textContent = 'No results';
      paletteResults.appendChild(empty);
      return;
    }
    filtered.forEach((it, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'command-palette-result';
      btn.dataset.section = it.section;
      btn.setAttribute('data-idx', i);
      btn.innerHTML = `<span class="command-palette-title">${it.title}</span><span class="command-palette-meta"><span class="command-palette-section">${it.meta}</span></span>`;
      btn.addEventListener('click', () => {
        closePalette();
        scrollToId(it.section);
      });
      paletteResults.appendChild(btn);
    });
  }
  selectPalette(0);
}

function selectPalette(index) {
  const items = paletteResults.querySelectorAll('.command-palette-result, .command-palette-command');
  items.forEach((el, i) => el.classList.toggle('selected', i === index));
}

function runPaletteCommand(name) {
  const cmd = commands.find(c => c.name === name);
  if (!cmd) return;
  closePalette();
  cmd.run();
}

paletteInput.addEventListener('input', () => renderPalette(paletteInput.value));

paletteInput.addEventListener('keydown', (e) => {
  const items = Array.from(paletteResults.querySelectorAll('.command-palette-result, .command-palette-command'));
  const sel = paletteResults.querySelector('.selected');
  const idx = items.indexOf(sel);
  if (e.key === 'Enter') {
    if (sel) sel.click();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectPalette((idx + 1) % Math.max(1, items.length));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectPalette((idx - 1 + Math.max(1, items.length)) % Math.max(1, items.length));
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closePalette();
  }
});

document.querySelectorAll('[data-close-palette]').forEach(el => el.addEventListener('click', closePalette));

/* ---------- Shortcuts modal ---------- */
function openShortcuts() {
  shortcutsModal.classList.add('open');
}
function closeShortcuts() {
  shortcutsModal.classList.remove('open');
}
document.querySelectorAll('[data-close-shortcuts]').forEach(el => el.addEventListener('click', closeShortcuts));
document.querySelectorAll('[data-open-help]').forEach(el => el.addEventListener('click', openShortcuts));

/* ---------- Keyboard ---------- */
let isHelpKeysActive = false;
let pendingKeys = '';

function handleQuickKeys(e) {
  if (pendingKeys === 'g' && e.key.toLowerCase() === 'g') {
    pendingKeys = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }
  pendingKeys = '';
  return false;
}

document.addEventListener('keydown', (e) => {
  if (handleQuickKeys(e)) return;

  const target = e.target;
  const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  const modalOpen = palette.classList.contains('open') || shortcutsModal.classList.contains('open') || commandWrap.classList.contains('is-active');

  /* Meta shortcuts always work */
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (palette.classList.contains('open')) closePalette();
    else openPalette('search');
    return;
  }

  if (typing) {
    if (e.key === 'Escape') {
      if (palette.classList.contains('open')) closePalette();
      else if (shortcutsModal.classList.contains('open')) closeShortcuts();
      else if (commandWrap.classList.contains('is-active')) setCommandMode(false);
    }
    return;
  }

  if (modalOpen) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette(); closeShortcuts(); setCommandMode(false);
    }
    return;
  }

  switch (e.key) {
    case ':':
      e.preventDefault();
      setCommandMode(true);
      break;
    case '/':
      e.preventDefault();
      openPalette('search');
      break;
    case '?':
      e.preventDefault();
      openShortcuts();
      break;
    case 'j':
      window.scrollBy({ top: window.innerHeight * 0.06, behavior: 'auto' });
      break;
    case 'k':
      window.scrollBy({ top: -window.innerHeight * 0.06, behavior: 'auto' });
      break;
    case 'g':
      pendingKeys = 'g';
      break;
    case 'G':
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      break;
    case '}':
      e.preventDefault();
      scrollToNextSection(1);
      break;
    case '{':
      e.preventDefault();
      scrollToNextSection(-1);
      break;
    case 'd':
      if (e.ctrlKey) { e.preventDefault(); window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'auto' }); }
      break;
    case 'u':
      if (e.ctrlKey) { e.preventDefault(); window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'auto' }); }
      break;
  }
});

function scrollToNextSection(dir) {
  const ids = ['home', ...sections];
  const current = activeSectionId();
  let idx = ids.indexOf(current);
  if (idx === -1) idx = 0;
  const next = (idx + dir + ids.length) % ids.length;
  scrollToId(ids[next]);
}

/* ---------- Nav links ---------- */
document.querySelectorAll('[data-nav]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    scrollToId(href.slice(1));
  });
});

/* ---------- Init ---------- */
updateStatusline();
