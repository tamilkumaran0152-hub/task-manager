require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ================================
// Middleware
// ================================

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
    })
);

app.use(express.json());

// ================================
// Supabase
// ================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

// ================================
// PostgreSQL
// ================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ================================
// Authentication Middleware
// ================================

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "No authorization token provided",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Invalid authorization format",
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                error: "Invalid or expired token",
            });
        }

        // Store authenticated user
        req.user = data.user;

        next();
    } catch (error) {
        console.error("Authentication error:", error);

        res.status(500).json({
            error: "Authentication failed",
        });
    }
};

// ================================
// CREATE TASK
// ================================

app.post("/tasks", authenticateUser, async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                error: "Task title is required",
            });
        }

        const userId = req.user.id;

        const result = await pool.query(
            `INSERT INTO tasks (title, user_id)
             VALUES ($1, $2)
             RETURNING *`,
            [title, userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create task error:", error);

        res.status(500).json({
            error: "Database error",
        });
    }
});

// ================================
// GET USER'S TASKS
// ================================

app.get("/tasks", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT *
             FROM tasks
             WHERE user_id = $1
             ORDER BY id DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            error: "Database error",
        });
    }
});

// ================================
// UPDATE TASK
// ================================

app.patch("/tasks/:id", authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed, priority } = req.body;
        const userId = req.user.id;

        // Validate title if it is being updated
        if (
            title !== undefined &&
            (!title || title.trim() === "")
        ) {
            return res.status(400).json({
                error: "Task title is required",
            });
        }

        // Validate completed if it is being updated
        if (
            completed !== undefined &&
            typeof completed !== "boolean"
        ) {
            return res.status(400).json({
                error: "Completed must be true or false",
            });
        }

        // Validate priority if it is being updated
        if (
            priority !== undefined &&
            !["low", "medium", "high"].includes(priority)
        ) {
            return res.status(400).json({
                error: "Priority must be low, medium, or high",
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET
                title = COALESCE($1, title),
                completed = COALESCE($2, completed),
                priority = COALESCE($3, priority)
             WHERE id = $4
             AND user_id = $5
             RETURNING *`,
            [
                title !== undefined ? title : null,
                completed !== undefined ? completed : null,
                priority !== undefined ? priority : null,
                id,
                userId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update task error:", error);

        res.status(500).json({
            error: "Database error",
        });
    }
});

// ================================
// DELETE TASK
// ================================

app.delete("/tasks/:id", authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `DELETE FROM tasks
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found",
            });
        }

        res.json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            error: "Database error",
        });
    }
});

// ================================
// TEST BACKEND
// ================================

app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});