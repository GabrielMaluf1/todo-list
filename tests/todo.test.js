const assert = require("node:assert/strict");
const { normalizeTaskText, createTask, getStats, factorial, calculateExpression } = require("../script.js");

const normalized = normalizeTaskText("   estudar    Git   e GitHub   ");
assert.equal(normalized, "estudar Git e GitHub");

const task = createTask("  enviar pull request ");
assert.equal(task.text, "enviar pull request");
assert.equal(task.done, false);
assert.ok(task.id);
assert.ok(Date.parse(task.createdAt));

const stats = getStats([
  { done: true },
  { done: false },
  { done: false }
]);

assert.deepEqual(stats, {
  total: 3,
  done: 1,
  pending: 2
});

assert.equal(factorial(5), 120);
assert.equal(calculateExpression("2 + 3 * 4"), 14);
assert.equal(calculateExpression("sqrt(81) + 2^3"), 17);
assert.equal(calculateExpression("sin(30)", "deg"), 0.5);
assert.equal(calculateExpression("log(1000)"), 3);

console.log("Testes passaram: tarefas, calculadora e funções matemáticas funcionando.");
