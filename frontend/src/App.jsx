import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  // Get all tasks
  useEffect(() => {
    fetch("http://localhost:5000/tasks")
      .then((response) => response.json())
      .then((data) => setTasks(data));
  }, []);

  // Create a task
  const addTask = () => {
    if (!title.trim()) return;

    fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
      }),
    })
      .then((response) => response.json())
      .then((newTask) => {
        setTasks([...tasks, newTask]);
        setTitle("");
      });
  };

  // Update a task
  const editTask = (id, oldTitle) => {
    const newTitle = prompt("Enter new task title:", oldTitle);

    if (!newTitle || !newTitle.trim()) return;

    fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
      }),
    })
      .then((response) => response.json())
      .then((updatedTask) => {
        setTasks(
          tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
      });
  };

  // Delete a task
  const deleteTask = (id) => {
    fetch(`http://localhost:5000/tasks/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== id));
      });
  };

  return (
    <div>
      <h1>My Task Manager</h1>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a task"
      />

      <button onClick={addTask}>Add Task</button>

      <h2>Tasks</h2>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title}

            <button onClick={() => editTask(task.id, task.title)}>
              Edit
            </button>

            <button onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;