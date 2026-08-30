require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// CREATE - Add a new task
app.post("/tasks", async (req, res) => {
    try {
        const { title } = req.body;

        const result = await pool.query(
            "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
            [title]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database error");
    }
});

// READ - Get all tasks
app.get("/tasks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks");

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database error");
    }
});

// UPDATE - Edit a task
app.patch("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const result = await pool.query(
            "UPDATE tasks SET title = $1 WHERE id = $2 RETURNING *",
            [title, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database error");
    }
});

// DELETE - Delete a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM tasks WHERE id = $1",
            [id]
        );

        res.send("Task deleted");
    } catch (error) {
        console.error(error);
        res.status(500).send("Database error");
    }
});

// Test database connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

// Test backend
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// Start server
app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});