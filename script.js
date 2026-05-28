(function () {
  const taskStorageKey = "todo-list.tasks";
  const notesStorageKey = "todo-list.notes";

  function normalizeTaskText(text) {
    return String(text).trim().replace(/\s+/g, " ");
  }

  function createTask(text) {
    return {
      id: crypto.randomUUID(),
      text: normalizeTaskText(text),
      done: false,
      createdAt: new Date().toISOString()
    };
  }

  function getStats(tasks) {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    return {
      total,
      done,
      pending: total - done
    };
  }

  function pluralize(value, single, plural) {
    return value === 1 ? `${value} ${single}` : `${value} ${plural}`;
  }

  function factorial(value) {
    const number = Number(value);

    if (!Number.isInteger(number) || number < 0 || number > 170) {
      throw new Error("Fatorial aceita inteiros de 0 a 170.");
    }

    let result = 1;

    for (let index = 2; index <= number; index += 1) {
      result *= index;
    }

    return result;
  }

  function toRadians(value, angleMode) {
    return angleMode === "deg" ? Number(value) * Math.PI / 180 : Number(value);
  }

  function fromRadians(value, angleMode) {
    return angleMode === "deg" ? Number(value) * 180 / Math.PI : Number(value);
  }

  function sanitizeExpression(expression) {
    return String(expression)
      .replace(/,/g, ".")
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/−/g, "-")
      .replace(/\s+/g, "");
  }

  function prepareExpression(expression) {
    let prepared = sanitizeExpression(expression)
      .replace(/\bpi\b/gi, "PI")
      .replace(/\be\b/g, "E")
      .replace(/\^/g, "**")
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

    let previous;

    do {
      previous = prepared;
      prepared = prepared.replace(/(\d+(?:\.\d+)?|\([^()]+\))!/g, "factorial($1)");
    } while (prepared !== previous);

    return prepared;
  }

  function calculateExpression(expression, angleMode = "deg") {
    const prepared = prepareExpression(expression);
    const allowed = /^[0-9+\-*/().,%!<>=A-Za-z_\s]*$/;

    if (!prepared || !allowed.test(prepared)) {
      throw new Error("Expressão inválida.");
    }

    const helpers = {
      PI: Math.PI,
      E: Math.E,
      abs: Math.abs,
      acos: (value) => fromRadians(Math.acos(Number(value)), angleMode),
      asin: (value) => fromRadians(Math.asin(Number(value)), angleMode),
      atan: (value) => fromRadians(Math.atan(Number(value)), angleMode),
      ceil: Math.ceil,
      cos: (value) => Math.cos(toRadians(value, angleMode)),
      factorial,
      floor: Math.floor,
      ln: Math.log,
      log: Math.log10,
      max: Math.max,
      min: Math.min,
      pow: Math.pow,
      round: Math.round,
      sin: (value) => Math.sin(toRadians(value, angleMode)),
      sqrt: Math.sqrt,
      tan: (value) => Math.tan(toRadians(value, angleMode))
    };

    const names = Object.keys(helpers);
    const values = Object.values(helpers);
    const identifiers = prepared.match(/[A-Za-z_]\w*/g) ?? [];

    if (identifiers.some((identifier) => !names.includes(identifier))) {
      throw new Error("Função não reconhecida.");
    }

    const result = Function(...names, `"use strict"; return (${prepared});`)(...values);

    if (!Number.isFinite(result)) {
      throw new Error("Resultado inválido.");
    }

    return Number.parseFloat(result.toFixed(12));
  }

  function loadTasks() {
    try {
      const savedTasks = JSON.parse(localStorage.getItem(taskStorageKey));
      return Array.isArray(savedTasks) ? savedTasks : [];
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
  }

  if (typeof document === "undefined") {
    module.exports = {
      normalizeTaskText,
      createTask,
      getStats,
      factorial,
      calculateExpression
    };
    return;
  }

  const state = {
    tasks: loadTasks(),
    filter: "all"
  };

  const form = document.getElementById("taskForm");
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");
  const formMessage = document.getElementById("formMessage");
  const taskCounter = document.getElementById("taskCounter");
  const pendingCounter = document.getElementById("pendingCounter");
  const clearDoneButton = document.getElementById("clearDoneButton");
  const filters = document.querySelectorAll(".filter");
  const emptyTemplate = document.getElementById("emptyTemplate");
  const notesInput = document.getElementById("notesInput");
  const notesCounter = document.getElementById("notesCounter");
  const notesStatus = document.getElementById("notesStatus");
  const clearNotesButton = document.getElementById("clearNotesButton");
  const calculatorInput = document.getElementById("calculatorInput");
  const calculatorResult = document.getElementById("calculatorResult");
  const calculatorGrid = document.querySelector(".calculator-grid");
  const calculatorFunction = document.getElementById("calculatorFunction");
  const angleMode = document.getElementById("angleMode");

  function getVisibleTasks() {
    if (state.filter === "pending") {
      return state.tasks.filter((task) => !task.done);
    }

    if (state.filter === "done") {
      return state.tasks.filter((task) => task.done);
    }

    return state.tasks;
  }

  function setMessage(message) {
    formMessage.textContent = message;
  }

  function renderTasks() {
    const visibleTasks = getVisibleTasks();
    const stats = getStats(state.tasks);

    list.replaceChildren();

    if (visibleTasks.length === 0) {
      list.append(emptyTemplate.content.cloneNode(true));
    } else {
      visibleTasks.forEach((task) => list.append(createTaskElement(task)));
    }

    taskCounter.textContent = pluralize(stats.total, "tarefa", "tarefas");
    pendingCounter.textContent = stats.pending === 0 ? "Nenhuma pendente" : pluralize(stats.pending, "pendente", "pendentes");
    clearDoneButton.disabled = stats.done === 0;

    filters.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === state.filter);
    });
  }

  function createTaskElement(task) {
    const item = document.createElement("li");
    const checkbox = document.createElement("input");
    const text = document.createElement("span");
    const removeButton = document.createElement("button");

    item.className = task.done ? "task-item done" : "task-item";
    item.dataset.id = task.id;

    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Marcar ${task.text}`);

    text.className = "task-text";
    text.textContent = task.text;

    removeButton.className = "remove-task";
    removeButton.type = "button";
    removeButton.textContent = "X";
    removeButton.setAttribute("aria-label", `Remover ${task.text}`);

    item.append(checkbox, text, removeButton);
    return item;
  }

  function addTask(text) {
    const taskText = normalizeTaskText(text);

    if (!taskText) {
      setMessage("Digite uma tarefa antes de adicionar.");
      input.focus();
      return;
    }

    state.tasks.unshift(createTask(taskText));
    saveTasks(state.tasks);
    input.value = "";
    setMessage("Tarefa adicionada.");
    renderTasks();
  }

  function toggleTask(id) {
    state.tasks = state.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
    saveTasks(state.tasks);
    setMessage("");
    renderTasks();
  }

  function removeTask(id) {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    saveTasks(state.tasks);
    setMessage("Tarefa removida.");
    renderTasks();
  }

  function clearDoneTasks() {
    state.tasks = state.tasks.filter((task) => !task.done);
    saveTasks(state.tasks);
    setMessage("Tarefas concluídas removidas.");
    renderTasks();
  }

  function updateNotesCounter() {
    notesCounter.textContent = pluralize(notesInput.value.length, "caractere", "caracteres");
  }

  function saveNotes() {
    localStorage.setItem(notesStorageKey, notesInput.value);
    updateNotesCounter();
    notesStatus.textContent = notesInput.value ? "Notas salvas" : "Salvo automaticamente";
  }

  function clearNotes() {
    notesInput.value = "";
    saveNotes();
    notesInput.focus();
  }

  function insertAtCursor(value) {
    const start = calculatorInput.selectionStart ?? calculatorInput.value.length;
    const end = calculatorInput.selectionEnd ?? calculatorInput.value.length;
    const current = calculatorInput.value;

    calculatorInput.value = `${current.slice(0, start)}${value}${current.slice(end)}`;
    calculatorInput.focus();
    calculatorInput.setSelectionRange(start + value.length, start + value.length);
  }

  function showCalculation() {
    try {
      const result = calculateExpression(calculatorInput.value, angleMode.value);
      calculatorResult.textContent = String(result);
    } catch (error) {
      calculatorResult.textContent = error.message;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask(input.value);
  });

  list.addEventListener("change", (event) => {
    const item = event.target.closest(".task-item");

    if (event.target.matches(".task-check") && item) {
      toggleTask(item.dataset.id);
    }
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest(".task-item");

    if (event.target.matches(".remove-task") && item) {
      removeTask(item.dataset.id);
    }
  });

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      setMessage("");
      renderTasks();
    });
  });

  clearDoneButton.addEventListener("click", clearDoneTasks);

  notesInput.value = localStorage.getItem(notesStorageKey) ?? "";
  notesInput.addEventListener("input", saveNotes);
  clearNotesButton.addEventListener("click", clearNotes);

  calculatorGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    if (button.dataset.action === "clear") {
      calculatorInput.value = "";
      calculatorResult.textContent = "0";
      calculatorInput.focus();
      return;
    }

    if (button.dataset.action === "backspace") {
      calculatorInput.value = calculatorInput.value.slice(0, -1);
      calculatorInput.focus();
      return;
    }

    if (button.dataset.action === "calculate") {
      showCalculation();
      return;
    }

    insertAtCursor(button.dataset.value);
  });

  calculatorInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      showCalculation();
    }
  });

  calculatorFunction.addEventListener("change", () => {
    if (!calculatorFunction.value) {
      return;
    }

    insertAtCursor(calculatorFunction.value);
    calculatorFunction.value = "";
  });

  angleMode.addEventListener("change", () => {
    if (calculatorInput.value) {
      showCalculation();
    }
  });

  renderTasks();
  updateNotesCounter();
})();
