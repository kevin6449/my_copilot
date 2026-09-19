const STORAGE_KEY = 'workshop-todos';
const THEME_KEY = 'workshop-theme';
const FILTER_KEY = 'workshop-filter';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const filterButtons = document.querySelectorAll('.btn-filter');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const clearCompletedButton = document.getElementById('clear-completed');

let todos = loadTodos();
let currentFilter = 'all';

function getStorage() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage 不可用,資料將只保存在記憶體中。', error);
    return null;
  }
}

function loadTodos() {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const saved = storage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      storage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed;
  } catch (error) {
    console.warn('讀取待辦清單失敗,將以空清單開始。', error);
    storage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveTodos() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.warn('儲存待辦清單失敗。', error);
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

function initTheme() {
  const storage = getStorage();
  const savedTheme = storage ? storage.getItem(THEME_KEY) : null;

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

function getVisibleTodos() {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

function getEmptyMessage() {
  if (todos.length === 0) {
    return '還沒有任何待辦事項,新增一個吧!';
  }
  if (currentFilter === 'active') {
    return '太棒了,沒有未完成的事項!';
  }
  return '目前沒有已完成的事項,切換回「全部」即可查看其他待辦。';
}

function saveCurrentFilter() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FILTER_KEY, currentFilter);
  } catch (error) {
    console.warn('儲存篩選狀態失敗。', error);
  }
}

function render() {
  const visibleTodos = getVisibleTodos();

  list.replaceChildren();

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = getEmptyMessage();

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;

  const hasCompleted = todos.some((todo) => todo.completed);
  clearCompletedButton.hidden = !hasCompleted;
  clearCompletedButton.disabled = !hasCompleted;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addTodo(text) {
  todos.push({
    id: createId(),
    text,
    completed: false,
  });
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function clearCompletedTodos() {
  const completedItems = todos.filter((todo) => todo.completed).length;
  if (completedItems === 0) {
    return;
  }

  const confirmed = window.confirm(`確定要刪除 ${completedItems} 個已完成項目嗎？`);
  if (!confirmed) {
    return;
  }

  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

function setFilter(filter) {
  if (!['all', 'active', 'completed'].includes(filter)) {
    currentFilter = 'all';
  } else {
    currentFilter = filter;
  }

  saveCurrentFilter();

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  render();
}

function initFilter() {
  const storage = getStorage();
  const savedFilter = storage ? storage.getItem(FILTER_KEY) : null;

  if (savedFilter === 'all' || savedFilter === 'active' || savedFilter === 'completed') {
    currentFilter = savedFilter;
  } else {
    currentFilter = 'all';
  }

  setFilter(currentFilter);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addTodo(text);
  input.value = '';
  input.focus();
});

list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;

  const id = item.dataset.id;

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTodo(id);
  } else if (event.target.matches('.btn-delete')) {
    deleteTodo(id);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

clearCompletedButton.addEventListener('click', () => {
  clearCompletedTodos();
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);

  const storage = getStorage();
  if (storage) {
    storage.setItem(THEME_KEY, nextTheme);
  }
});

initTheme();
initFilter();
render();
