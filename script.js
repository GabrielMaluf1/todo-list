function addTask() {
  const input = document.getElementById("taskInput");
  const taskText = input.value;

  if (taskText === "") {
    alert("Digite uma tarefa!");
    return;
  }

  const li = document.createElement("li");

  li.innerHTML = `
    <span onclick="toggleTask(this)">
      ${taskText}
    </span>
    <button onclick="removeTask(this)">X</button>
  `;

  document.getElementById("taskList").appendChild(li);

  input.value = "";
}

function toggleTask(element) {
  element.classList.toggle("completed");
}

function removeTask(button) {
  button.parentElement.remove();
}
