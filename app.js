/* Notes Taker App - Modern Tailwind + JS */
(function () {
  const LS_KEY = 'notes_taker__notes';
  const THEME_KEY = 'notes_taker__theme';
  const CATS_KEY = 'notes_taker__categories';

  const els = {
    form: document.getElementById('noteForm'),
    title: document.getElementById('title'),
    content: document.getElementById('content'),
    tags: document.getElementById('tags'),
    color: document.getElementById('color'),
    notesGrid: document.getElementById('notesGrid'),
    emptyState: document.getElementById('emptyState'),
    themeToggle: document.getElementById('themeToggle'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),
    searchInput: document.getElementById('searchInput'),
    searchInputMobile: document.getElementById('searchInputMobile'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    // date filters (home)
    dateStart: document.getElementById('dateStart'),
    dateEnd: document.getElementById('dateEnd'),
    clearDates: document.getElementById('clearDates'),
    // categories
    categoriesList: document.getElementById('categoriesList'),
    categoryForm: document.getElementById('categoryForm'),
    categoryName: document.getElementById('categoryName'),
    categorySelect: document.getElementById('categorySelect'),
    categorySelectMobile: document.getElementById('categorySelectMobile'),
    // all notes view
    openAllNotes: document.getElementById('openAllNotes'),
    allNotesView: document.getElementById('allNotesView'),
    closeAllNotes: document.getElementById('closeAllNotes'),
    allMasonry: document.getElementById('allMasonry'),
    searchAllInput: document.getElementById('searchAllInput'),
    categorySelectAll: document.getElementById('categorySelectAll'),
    dateStartAll: document.getElementById('dateStartAll'),
    dateEndAll: document.getElementById('dateEndAll'),
    // edit dialog
    editDialog: document.getElementById('editDialog'),
    editForm: document.getElementById('editForm'),
    closeEdit: document.getElementById('closeEdit'),
    editId: document.getElementById('editId'),
    editTitle: document.getElementById('editTitle'),
    editContent: document.getElementById('editContent'),
    editTags: document.getElementById('editTags'),
    editColor: document.getElementById('editColor'),
    editCategory: document.getElementById('editCategory'),
    saveEdit: document.getElementById('saveEdit'),
    // markdown preview tabs
    writeTab: document.getElementById('writeTab'),
    previewTab: document.getElementById('previewTab'),
    contentPreview: document.getElementById('contentPreview'),
    editWriteTab: document.getElementById('editWriteTab'),
    editPreviewTab: document.getElementById('editPreviewTab'),
    editPreview: document.getElementById('editPreview'),
  };

  const state = {
    notes: [],
    filter: '',
    theme: 'system',
    categories: [],
    selectedCategory: 'All',
    draggedId: null,
    route: 'home',
    dateStart: '',
    dateEnd: '',
  };

  // Utilities
  const uuid = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();
  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(state.notes));
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      state.notes = raw ? JSON.parse(raw) : [];
    } catch {
      state.notes = [];
    }
  }

  function saveCategories() {
    localStorage.setItem(CATS_KEY, JSON.stringify(state.categories));
  }
  function loadCategories() {
    try {
      const raw = localStorage.getItem(CATS_KEY);
      state.categories = raw ? JSON.parse(raw) : [];
    } catch {
      state.categories = [];
    }
    if (!state.categories || state.categories.length === 0) {
      state.categories = ['General', 'Personal', 'Work'];
    }
  }

  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    state.theme = saved || 'system';
    applyTheme();
  }
  function applyTheme() {
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = state.theme === 'dark' || (state.theme === 'system' && isSystemDark);
    document.documentElement.classList.toggle('dark', dark);
    els.sunIcon.classList.toggle('hidden', !dark);
    els.moonIcon.classList.toggle('hidden', dark);
  }

  // CRUD operations
  function addNote({ title, content, tags, color, category }) {
    const note = {
      id: uuid(),
      title: title.trim(),
      content: content.trim(),
      tags: parseTags(tags),
      color: color || 'indigo',
      category: category || (state.selectedCategory === 'All' ? 'General' : state.selectedCategory),
      pinned: false,
      createdAt: now(),
      updatedAt: now(),
      orderIndex: nextOrderIndexForCategory(category || state.selectedCategory),
    };
    state.notes.push(note);
    save();
    render();
  }

  function nextOrderIndexForCategory(cat) {
    const category = cat && cat !== 'All' ? cat : null;
    const relevant = state.notes.filter((n) => (category ? n.category === category : true));
    const max = relevant.reduce((m, n) => (typeof n.orderIndex === 'number' ? Math.max(m, n.orderIndex) : m), -1);
    return max + 1;
  }

  function updateNote(id, patch) {
    const idx = state.notes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    state.notes[idx] = {
      ...state.notes[idx],
      ...patch,
      updatedAt: now(),
    };
    save();
    render();
  }

  function deleteNote(id) {
    state.notes = state.notes.filter((n) => n.id !== id);
    save();
    render();
  }

  function togglePin(id) {
    const note = state.notes.find((n) => n.id === id);
    if (!note) return;
    updateNote(id, { pinned: !note.pinned });
  }

  function parseTags(str) {
    if (!str) return [];
    return str
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function matchesFilter(note, filter) {
    // category filter
    if (state.selectedCategory !== 'All' && note.category !== state.selectedCategory) {
      return false;
    }
    // date range filter using createdAt (inclusive)
    if (state.dateStart || state.dateEnd) {
      const created = new Date(note.createdAt);
      if (state.dateStart) {
        const start = new Date(state.dateStart);
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }
      if (state.dateEnd) {
        const end = new Date(state.dateEnd);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
    }
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      note.title.toLowerCase().includes(f) ||
      note.content.toLowerCase().includes(f) ||
      note.tags.some((t) => t.toLowerCase().includes(f))
    );
  }

  function sortNotes(a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const ai = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER;
    const bi = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    // fallback newest first
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }

  // Rendering
  function render() {
    const filtered = state.notes.filter((n) => matchesFilter(n, state.filter)).sort(sortNotes);
    // Home grid
    if (els.notesGrid) {
      els.notesGrid.innerHTML = '';
      if (els.emptyState) els.emptyState.classList.toggle('hidden', filtered.length !== 0);
      for (const note of filtered) {
        els.notesGrid.appendChild(noteCard(note));
      }
    }
    // All notes masonry view
    if (els.allMasonry) {
      els.allMasonry.innerHTML = '';
      if (state.route === 'all') {
        for (const note of filtered) {
          els.allMasonry.appendChild(noteCard(note));
        }
      }
    }
    // Show/hide the All Notes section
    if (els.allNotesView) {
      els.allNotesView.classList.toggle('hidden', state.route !== 'all');
    }
    renderCategoriesUI();
    populateCategorySelects();
  }

  const colorRing = (c) => {
    const map = {
      indigo: 'ring-indigo-400',
      emerald: 'ring-emerald-400',
      rose: 'ring-rose-400',
      amber: 'ring-amber-400',
      sky: 'ring-sky-400',
      violet: 'ring-violet-400',
    };
    return map[c] || map.indigo;
  };

  function noteCard(note) {
    const card = document.createElement('article');
    card.className = `group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ring-2 ${colorRing(note.color)}/50 hover:ring-4 transition-shadow shadow-soft p-4 flex flex-col break-inside-avoid mb-4`;
    card.setAttribute('draggable', 'true');
    card.dataset.id = note.id;

    // Pin badge
    const pin = document.createElement('button');
    pin.className = 'absolute top-3 right-3 rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';
    pin.setAttribute('aria-label', note.pinned ? 'Unpin note' : 'Pin note');
    pin.innerHTML = note.pinned
      ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-amber-500"><path d="M15.53 2.47a.75.75 0 0 1 1.06 0l4.94 4.94a.75.75 0 0 1 0 1.06L19.06 10l.97.97a.75.75 0 0 1-.53 1.28H13.5V21a.75.75 0 0 1-1.28.53l-2.62-2.62l-2.12 2.12a.75.75 0 0 1-1.28-.53V14.06H1.75a.75.75 0 0 1-.53-1.28l2.12-2.12L.72 8.03A.75.75 0 0 1 .72 6.97l4.94-4.94a.75.75 0 0 1 1.06 0l3.38 3.38l4.43-2.94Z"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M8.59 2.92a.75.75 0 0 1 .92-.54l6.67 1.78a.75.75 0 0 1 .48 1.13l-2.77 4.45l3.59 3.59a.75.75 0 0 1-.53 1.28h-5.69l-3.69 5.53a.75.75 0 0 1-1.34-.4l-.3-3.61l-3.61-.3a.75.75 0 0 1-.4-1.34l5.53-3.69V8.59L8.59 2.92Z"/></svg>';
    pin.addEventListener('click', () => togglePin(note.id));
    card.appendChild(pin);

    // Title
    const h3 = document.createElement('h3');
    h3.className = 'text-base font-semibold mb-1 pr-10';
    h3.textContent = note.title || 'Untitled';
    card.appendChild(h3);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'text-xs text-slate-500 dark:text-slate-400 mb-2';
    meta.textContent = `Updated ${fmtDate(note.updatedAt)}`;
    card.appendChild(meta);

    // Content
    const content = document.createElement('div');
    content.className = 'text-sm leading-relaxed prose prose-sm dark:prose-invert';
    content.innerHTML = renderMarkdown(note.content);
    card.appendChild(content);

    // Tags
    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'flex flex-wrap gap-2 mt-3';
    for (const t of note.tags) {
      const chip = document.createElement('span');
      chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      chip.textContent = `#${t}`;
      tagsWrap.appendChild(chip);
    }
    card.appendChild(tagsWrap);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'mt-4 flex items-center gap-2';
    const editBtn = document.createElement('button');
    editBtn.className = 'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700';
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M21.73 7.05a2.25 2.25 0 0 0 0-3.18l-1.6-1.6a2.25 2.25 0 0 0-3.18 0L4.55 14.7a2.25 2.25 0 0 0-.57 1l-.72 2.88a.75.75 0 0 0 .91.91l2.88-.72a2.25 2.25 0 0 0 1-.57L21.73 7.05Z"/></svg> Edit';
    editBtn.addEventListener('click', () => openEdit(note));
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-rose-100/60 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-800/60';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M9.75 3a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V4.5h4.5a.75.75 0 0 1 0 1.5h-.51l-1.07 12.01A2.25 2.25 0 0 1 15.01 20.25H8.99a2.25 2.25 0 0 1-2.16-2.24L5.76 6h-.51a.75.75 0 0 1 0-1.5H9.75V3Zm2.25 3a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V6.75a.75.75 0 0 1 .75-.75Zm-3 0a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V6.75a.75.75 0 0 1 .75-.75Zm6 0a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V6.75a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"/></svg> Delete';
    deleteBtn.addEventListener('click', () => {
      const ok = confirm('Delete this note?');
      if (ok) deleteNote(note.id);
    });
    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);

    // drag events
    card.addEventListener('dragstart', (e) => {
      state.draggedId = note.id;
      e.dataTransfer.setData('text/plain', note.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('opacity-60');
    });
    card.addEventListener('dragend', () => {
      state.draggedId = null;
      card.classList.remove('opacity-60');
    });

    return card;
  }

  // Edit dialog
  function openEdit(note) {
    els.editId.value = note.id;
    els.editTitle.value = note.title;
    els.editContent.value = note.content;
    els.editTags.value = note.tags.join(', ');
    els.editColor.value = note.color;
    els.editCategory.value = note.category || 'General';
    if (typeof els.editDialog.showModal === 'function') {
      els.editDialog.showModal();
    } else {
      // fallback for browsers without <dialog>
      els.editDialog.setAttribute('open', '');
    }
    updateEditPreview();
  }

  function closeEdit() {
    els.editDialog.close();
  }

  // Event bindings
  function bindEvents() {
    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      addNote({
        title: els.title.value,
        content: els.content.value,
        tags: els.tags.value,
        color: els.color.value,
        category: els.categorySelect.value || state.selectedCategory,
      });
      els.form.reset();
      els.title.focus();
      // reset tabs to write
      showWriteTab();
    });

    for (const input of [els.searchInput, els.searchInputMobile]) {
      if (!input) continue;
      input.addEventListener('input', () => {
        state.filter = input.value;
        render();
      });
    }
    if (els.searchAllInput) {
      els.searchAllInput.addEventListener('input', () => {
        state.filter = els.searchAllInput.value;
        render();
      });
    }

    els.themeToggle.addEventListener('click', () => {
      // cycle: system -> dark -> light -> system
      const next = { system: 'dark', dark: 'light', light: 'system' }[state.theme] || 'dark';
      state.theme = next;
      saveTheme(state.theme);
      applyTheme();
    });

    // Export
    els.exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.notes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes_taker_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    els.importInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Invalid file format');
        // Basic validation
        state.notes = data
          .filter((n) => n && typeof n === 'object' && n.id && n.title !== undefined)
          .map((n) => ({
            id: n.id || uuid(),
            title: String(n.title || '').trim(),
            content: String(n.content || '').trim(),
            tags: Array.isArray(n.tags) ? n.tags.filter(Boolean) : parseTags(n.tags || ''),
            color: n.color || 'indigo',
            category: n.category || 'General',
            pinned: Boolean(n.pinned),
            createdAt: n.createdAt || now(),
            updatedAt: n.updatedAt || now(),
            orderIndex: typeof n.orderIndex === 'number' ? n.orderIndex : nextOrderIndexForCategory(n.category || 'General'),
          }));
        save();
        render();
      } catch (err) {
        alert('Failed to import: ' + err.message);
      } finally {
        e.target.value = '';
      }
    });

    // Edit dialog events
    els.closeEdit.addEventListener('click', (e) => {
      e.preventDefault();
      closeEdit();
    });
    els.editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = els.editId.value;
      updateNote(id, {
        title: els.editTitle.value,
        content: els.editContent.value,
        tags: parseTags(els.editTags.value),
        color: els.editColor.value,
        category: els.editCategory.value,
      });
      closeEdit();
    });

    // Categories
    els.categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (els.categoryName.value || '').trim();
      if (!name) return;
      if (!state.categories.includes(name)) {
        state.categories.push(name);
        saveCategories();
        state.selectedCategory = name;
        els.categoryName.value = '';
        render();
      }
    });
    els.categorySelectMobile.addEventListener('change', () => {
      state.selectedCategory = els.categorySelectMobile.value;
      render();
    });
    if (els.categorySelectAll) {
      els.categorySelectAll.addEventListener('change', () => {
        state.selectedCategory = els.categorySelectAll.value;
        render();
      });
    }

    // Date filters
    const applyDates = () => { render(); };
    if (els.dateStart) els.dateStart.addEventListener('change', (e) => { state.dateStart = e.target.value; applyDates(); });
    if (els.dateEnd) els.dateEnd.addEventListener('change', (e) => { state.dateEnd = e.target.value; applyDates(); });
    if (els.clearDates) els.clearDates.addEventListener('click', () => { state.dateStart = ''; state.dateEnd = ''; if (els.dateStart) els.dateStart.value=''; if (els.dateEnd) els.dateEnd.value=''; if (els.dateStartAll) els.dateStartAll.value=''; if (els.dateEndAll) els.dateEndAll.value=''; render(); });
    if (els.dateStartAll) els.dateStartAll.addEventListener('change', (e) => { state.dateStart = e.target.value; applyDates(); });
    if (els.dateEndAll) els.dateEndAll.addEventListener('change', (e) => { state.dateEnd = e.target.value; applyDates(); });

    // All notes view routing
    if (els.openAllNotes) {
      els.openAllNotes.addEventListener('click', () => {
        state.route = 'all';
        // sync inputs
        if (els.searchAllInput) els.searchAllInput.value = state.filter;
        if (els.categorySelectAll) els.categorySelectAll.value = state.selectedCategory;
        if (els.dateStartAll) els.dateStartAll.value = state.dateStart || '';
        if (els.dateEndAll) els.dateEndAll.value = state.dateEnd || '';
        render();
        window.scrollTo({ top: 0 });
      });
    }
    if (els.closeAllNotes) {
      els.closeAllNotes.addEventListener('click', () => {
        state.route = 'home';
        render();
      });
    }

    // Markdown preview tabs
    els.writeTab.addEventListener('click', showWriteTab);
    els.previewTab.addEventListener('click', showPreviewTab);
    els.content.addEventListener('input', () => updateCreatePreview());
    els.editWriteTab.addEventListener('click', showEditWriteTab);
    els.editPreviewTab.addEventListener('click', showEditPreviewTab);
    els.editContent.addEventListener('input', () => updateEditPreview());

    // Drag & drop on grid
    els.notesGrid.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    els.notesGrid.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetCard = e.target.closest('article');
      const draggedId = state.draggedId || e.dataTransfer.getData('text/plain');
      const targetId = targetCard ? targetCard.dataset.id : null;
      if (!draggedId || !targetId || draggedId === targetId) return;
      performReorder(draggedId, targetId);
    });
  }

  function performReorder(draggedId, targetId) {
    const dragged = state.notes.find((n) => n.id === draggedId);
    const target = state.notes.find((n) => n.id === targetId);
    if (!dragged || !target) return;
    if (dragged.pinned !== target.pinned) {
      alert('Reordering across pinned and unpinned groups is not supported. Unpin/pin to move between groups.');
      return;
    }
    // Work within current filtered list and same pinned group
    const filtered = state.notes
      .filter((n) => matchesFilter(n, state.filter))
      .filter((n) => n.pinned === dragged.pinned)
      .sort(sortNotes);
    const ids = filtered.map((n) => n.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    // Assign new orderIndex for this group
    ids.forEach((id, idx) => {
      const n = state.notes.find((x) => x.id === id);
      if (n) n.orderIndex = idx;
    });
    save();
    render();
  }

  // Categories UI
  function renderCategoriesUI() {
    if (!els.categoriesList) return;
    const items = [
      { name: 'All', count: state.notes.length },
      ...state.categories.map((c) => ({ name: c, count: state.notes.filter((n) => n.category === c).length })),
    ];
    els.categoriesList.innerHTML = '';
    for (const item of items) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'w-full text-left rounded-lg px-3 py-2 text-sm border border-transparent hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between';
      a.textContent = item.name;
      const badge = document.createElement('span');
      badge.className = 'ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800';
      badge.textContent = String(item.count);
      a.appendChild(badge);
      if (state.selectedCategory === item.name) {
        a.classList.add('bg-primary/10', 'text-primary');
      }
      a.addEventListener('click', () => {
        state.selectedCategory = item.name;
        render();
      });
      els.categoriesList.appendChild(a);
    }
  }

  function populateCategorySelects() {
    const makeOptions = () => {
      const opts = ['All', ...state.categories];
      return opts.map((c) => `<option value="${c}">${c}</option>`).join('');
    };
    if (els.categorySelectMobile) {
      els.categorySelectMobile.innerHTML = makeOptions();
      els.categorySelectMobile.value = state.selectedCategory;
    }
    const makeCatOnly = () => state.categories.map((c) => `<option value="${c}">${c}</option>`).join('');
    if (els.categorySelect) {
      els.categorySelect.innerHTML = makeCatOnly();
      els.categorySelect.value = state.selectedCategory === 'All' ? (state.categories[0] || 'General') : state.selectedCategory;
    }
    if (els.editCategory) {
      els.editCategory.innerHTML = makeCatOnly();
    }
    if (els.categorySelectAll) {
      els.categorySelectAll.innerHTML = makeOptions();
      els.categorySelectAll.value = state.selectedCategory;
    }
  }

  // Markdown helpers
  function renderMarkdown(text) {
    try {
      // marked is loaded via CDN
      marked.setOptions({ breaks: true, gfm: true });
      const html = marked.parse(String(text || ''));
      return DOMPurify.sanitize(html);
    } catch {
      return String(text || '');
    }
  }

  function showWriteTab() {
    els.writeTab.classList.add('bg-slate-100', 'dark:bg-slate-800');
    els.previewTab.classList.remove('bg-slate-100', 'dark:bg-slate-800');
    els.content.classList.remove('hidden');
    els.contentPreview.classList.add('hidden');
  }
  function showPreviewTab() {
    els.previewTab.classList.add('bg-slate-100', 'dark:bg-slate-800');
    els.writeTab.classList.remove('bg-slate-100', 'dark:bg-slate-800');
    updateCreatePreview();
    els.content.classList.add('hidden');
    els.contentPreview.classList.remove('hidden');
  }
  function updateCreatePreview() {
    els.contentPreview.innerHTML = renderMarkdown(els.content.value);
  }

  function showEditWriteTab() {
    els.editWriteTab.classList.add('bg-slate-100', 'dark:bg-slate-800');
    els.editPreviewTab.classList.remove('bg-slate-100', 'dark:bg-slate-800');
    els.editContent.classList.remove('hidden');
    els.editPreview.classList.add('hidden');
  }
  function showEditPreviewTab() {
    els.editPreviewTab.classList.add('bg-slate-100', 'dark:bg-slate-800');
    els.editWriteTab.classList.remove('bg-slate-100', 'dark:bg-slate-800');
    updateEditPreview();
    els.editContent.classList.add('hidden');
    els.editPreview.classList.remove('hidden');
  }
  function updateEditPreview() {
    els.editPreview.innerHTML = renderMarkdown(els.editContent.value);
  }

  function init() {
    load();
    loadCategories();
    loadTheme();
    bindEvents();
    render();
    showWriteTab();
    showEditWriteTab();
  }

  document.addEventListener('DOMContentLoaded', init);
})();