const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (CSS)
app.use(express.static(path.join(__dirname, "public")));

// Database connection
const db = mysql.createConnection({
  'host':'localhost','user':'root','password':'',database : "task_management",port:3307
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to the MySQL database.");
});

// Render the home page
app.get("/", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Task Management</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1>Task Management</h1>
      <h2>Create a New Task</h2>
      <form action="/create-task" method="POST">
        <label for="title">Task Title:</label><br>
        <input type="text" id="title" name="title" required><br><br>

        <label for="description">Task Description:</label><br>
        <textarea id="description" name="description" rows="4" cols="50"></textarea><br><br>

        <button type="submit">Create Task</button>
      </form>
      <h2>Actions</h2>
      <div class="footer">
        <a href="/tasks"><button>View All Tasks</button></a>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Render the All Tasks page
app.get("/tasks", (req, res) => {
  const query = "SELECT * FROM tasks";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Failed to fetch tasks:", err.message);
      return res.status(500).send("Database error. Please try again later.");
    }

    let taskTable = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>All Tasks</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <h1>All Tasks</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Completed</th>
            <th>Actions</th>
          </tr>
    `;

    results.forEach((task) => {
      taskTable += `
        <tr>
          <td>${task.id}</td>
          <td>${task.title}</td>
          <td>${task.description}</td>
          <td>${task.is_completed ? "Yes" : "No"}</td>
          <td class="action-buttons">
            <form action="/mark-complete/${task.id}" method="POST">
              <button class="complete" type="submit" ${task.is_completed ? "disabled" : ""}>Complete</button>
            </form>
            <form action="/edit-task/${task.id}" method="GET">
              <button class="edit" type="submit">Edit</button>
            </form>
            <form action="/delete-task/${task.id}" method="POST">
              <button class="delete" type="submit">Delete</button>
            </form>
          </td>
        </tr>
      `;
    });

    taskTable += `
        </table>
        <div class="footer">
          <a href="/"><button>Create New Task</button></a>
        </div>
      </body>
      </html>
    `;

    res.send(taskTable);
  });
});

// Handle task creation
app.post("/create-task", (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).send("Title cannot be empty. Please go back and try again.");
  }

  const query = "INSERT INTO tasks (title, description) VALUES (?, ?)";
  db.query(query, [title, description], (err) => {
    if (err) {
      console.error("Failed to create task:", err.message);
      return res.status(500).send("Database error. Please try again later.");
    }
    res.redirect("/");
  });
});

// Mark task as completed
app.post("/mark-complete/:id", (req, res) => {
  const { id } = req.params;

  const query = "UPDATE tasks SET is_completed = TRUE WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      console.error("Failed to mark task as complete:", err.message);
      return res.status(500).send("Database error. Please try again later.");
    }
    res.redirect("/tasks");
  });
});

// Render the edit task form
app.get("/edit-task/:id", (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM tasks WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err || results.length === 0) {
      console.error("Failed to fetch task:", err?.message || "Task not found");
      return res.status(404).send("Task not found. Please go back.");
    }

    const task = results[0];
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Edit Task</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <h1>Edit Task</h1>
        <form action="/update-task/${task.id}" method="POST">
          <label for="title">Task Title:</label><br>
          <input type="text" id="title" name="title" value="${task.title}" required><br><br>

          <label for="description">Task Description:</label><br>
          <textarea id="description" name="description" rows="4" cols="50">${task.description}</textarea><br><br>

          <button type="submit">Update Task</button>
        </form>
        <div class="footer">
          <a href="/tasks"><button>Cancel</button></a>
        </div>
      </body>
      </html>
    `);
  });
});

// Update task details
app.post("/update-task/:id", (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).send("Title cannot be empty. Please go back and try again.");
  }

  const query = "UPDATE tasks SET title = ?, description = ? WHERE id = ?";
  db.query(query, [title, description, id], (err) => {
    if (err) {
      console.error("Failed to update task:", err.message);
      return res.status(500).send("Database error. Please try again later.");
    }
    res.redirect("/tasks");
  });
});

// Delete a task
app.post("/delete-task/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM tasks WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      console.error("Failed to delete task:", err.message);
      return res.status(500).send("Database error. Please try again later.");
    }
    res.redirect("/tasks");
  });
});

// Start the server
const PORT = 3007;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
