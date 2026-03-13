import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Database configuration
const dbConfig = {
  host: "sql107.infinityfree.com",
  port: 3306,
  user: "if0_41301335",
  password: "Ub9srlaPSTuG7Y",
  database: "if0_41301335_dede",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool: mysql.Pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items LONGTEXT NOT NULL,
        updatedAt BIGINT NOT NULL
      )
    `;
    
    await pool.query(createTableQuery);
    console.log("Database initialized and connected successfully.");
  } catch (error) {
    console.error("Failed to connect or initialize database:", error);
    // Note: InfinityFree often blocks remote connections. 
    // If it fails, we log it but don't crash the server so the frontend can still load.
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/projects", async (req, res) => {
  try {
    if (!pool) throw new Error("Database not initialized");
    const [rows] = await pool.query("SELECT * FROM projects ORDER BY updatedAt DESC");
    
    const projects = (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      items: JSON.parse(row.items),
      updatedAt: row.updatedAt
    }));
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    if (!pool) throw new Error("Database not initialized");
    const { id, name, items, updatedAt } = req.body;
    
    const itemsJson = JSON.stringify(items);
    
    // Upsert logic for MySQL
    const query = `
      INSERT INTO projects (id, name, items, updatedAt)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        items = VALUES(items),
        updatedAt = VALUES(updatedAt)
    `;
    
    await pool.query(query, [id, name, itemsJson, updatedAt]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ error: "Failed to save project" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("Database not initialized");
    const { id } = req.params;
    
    await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

async function startServer() {
  await initDB();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
