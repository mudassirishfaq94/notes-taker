/* All Notes Page - Standalone view */
(function () {
  const LS_KEY = 'notes_taker__notes';
  const THEME_KEY = 'notes_taker__theme';
  const CATS_KEY = 'notes_taker__categories';

  const els = {
    backBtn: document.getElementById('backBtn'),
    allMasonry: document.getElementById('allMasonry'),
    searchAllInput: document.getElementById('searchAllInput'),
    categorySelectAll: document.getElementById('categorySelectAll'),
    dateStartAll: document.getElementById('dateStartAll'),
    dateEndAll: document.getElementById('dateEndAll'),
  };

  const state = {
    notes: [],
    categories: [],
    filter: '',
    selectedCategory: 'All',
    dateStart: '',
    dateEnd: '',
  };

  const now = () => new Date().toISOString();
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  function load() {
    try { state.notes = JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { state.notes = []; }
  }
  function loadCategories() {
    try { state.categories = JSON.parse(localStorage.getItem(CATS_KEY)) || []; } catch { state.categories = []; }
    if (!state.categories || state.categories.length === 0) state.categories = ['General', 'Personal', 'Work'];
  }
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'system';
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (saved === 'system' && isSystemDark);
    document.documentElement.classList.toggle('dark', dark);
  }

  function renderMarkdown(text) {
    try {
      marked.setOptions({ breaks: true, gfm: true });
      const html = marked.parse(String(text || ''));
      return DOMPurify.sanitize(html);
    } catch { return String(text || ''); }
  }

  function matches(note) {
    if (state.selectedCategory !== 'All' && note.category !== state.selectedCategory) return false;
    if (state.dateStart || state.dateEnd) {
      const created = new Date(note.createdAt || now());
      if (state.dateStart) {
        const s = new Date(state.dateStart); s.setHours(0,0,0,0);
        if (created < s) return false;
      }
      if (state.dateEnd) {
        const e = new Date(state.dateEnd); e.setHours(23,59,59,999);
        if (created > e) return false;
      }
    }
    if (!state.filter) return true;
    const f = state.filter.toLowerCase();
    return (
      (note.title || '').toLowerCase().includes(f) ||
      (note.content || '').toLowerCase().includes(f) ||
      (Array.isArray(note.tags) ? note.tags : []).some((t) => String(t).toLowerCase().includes(f))
    );
  }

  function sortNotes(a, b) {
    // Newest updated first
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  }

  function colorRing(c) {
    const map = {
      indigo: 'ring-indigo-400',
      emerald: 'ring-emerald-400',
      rose: 'ring-rose-400',
      amber: 'ring-amber-400',
      sky: 'ring-sky-400',
      violet: 'ring-violet-400',
    };
    return map[c] || map.indigo;
  }

  function noteCard(note) {
    const card = document.createElement('article');
    card.className = `group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ring-2 ${colorRing(note.color)}/50 hover:ring-4 transition-shadow shadow-soft p-4 flex flex-col break-inside-avoid mb-4`;

    const h3 = document.createElement('h3');
    h3.className = 'text-base font-semibold mb-1';
    h3.textContent = note.title || 'Untitled';
    card.appendChild(h3);

    const meta = document.createElement('div');
    meta.className = 'text-xs text-slate-500 dark:text-slate-400 mb-2';
    const cat = note.category ? ` • ${note.category}` : '';
    meta.textContent = `Updated ${fmtDate(note.updatedAt || note.createdAt)}${cat}`;
    card.appendChild(meta);

    const content = document.createElement('div');
    content.className = 'text-sm leading-relaxed prose prose-sm dark:prose-invert';
    content.innerHTML = renderMarkdown(note.content);
    card.appendChild(content);

    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'flex flex-wrap gap-2 mt-3';
    for (const t of note.tags || []) {
      const chip = document.createElement('span');
      chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      chip.textContent = `#${t}`;
      tagsWrap.appendChild(chip);
    }
    card.appendChild(tagsWrap);

    return card;
  }

  function populateCategories() {
    const opts = ['All', ...state.categories].map((c) => `<option value="${c}">${c}</option>`).join('');
    els.categorySelectAll.innerHTML = opts;
    els.categorySelectAll.value = state.selectedCategory;
  }

  function render() {
    const filtered = state.notes.filter(matches).sort(sortNotes);
    els.allMasonry.innerHTML = '';
    for (const note of filtered) {
      els.allMasonry.appendChild(noteCard(note));
    }
  }

  function bind() {
    els.backBtn.addEventListener('click', () => { window.location.href = './index.html'; });
    els.searchAllInput.addEventListener('input', () => { state.filter = els.searchAllInput.value; render(); });
    els.categorySelectAll.addEventListener('change', () => { state.selectedCategory = els.categorySelectAll.value; render(); });
    els.dateStartAll.addEventListener('change', (e) => { state.dateStart = e.target.value; render(); });
    els.dateEndAll.addEventListener('change', (e) => { state.dateEnd = e.target.value; render(); });
  }

  function init() {
    loadTheme();
    load();
    loadCategories();
    populateCategories();
    bind();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();