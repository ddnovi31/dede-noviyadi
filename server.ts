import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import fs from "fs";

// Lazy load DB modules
let mysql: any;
let sqlite3: any;
let open: any;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Directory for SQLite databases
const DB_DIR = path.join(process.cwd(), "databases");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

// Global state for active database
let activeDbType: 'mysql' | 'sqlite' = 'sqlite';
let activeSqliteDb: string | null = null;
let sqliteConn: any = null;
let mysqlPool: any = null;

// MySQL configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || "",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function initMysql() {
  if (!mysqlConfig.host || !mysqlConfig.user || !mysqlConfig.database) {
    console.log("MySQL configuration incomplete, skipping MySQL initialization.");
    return;
  }
  try {
    if (!mysql) {
      const m = await import("mysql2/promise");
      mysql = m.default || m;
    }
    mysqlPool = mysql.createPool(mysqlConfig);
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items LONGTEXT NOT NULL,
        updatedAt BIGINT NOT NULL,
        lmeParams LONGTEXT,
        materialPrices LONGTEXT,
        exchangeRate DOUBLE
      )
    `;
    await mysqlPool.query(createTableQuery);
    console.log("MySQL initialized.");
  } catch (error: any) {
    if (mysqlConfig.host.includes('infinityfree.com')) {
      console.error("MySQL initialization failed: InfinityFree blocks external database connections. You cannot connect to their MySQL servers from outside their hosting environment.");
    } else {
      console.error("MySQL initialization failed:", error.message || error);
    }
    mysqlPool = null;
  }
}

async function initSqlite(dbName: string) {
  try {
    if (!sqlite3 || !open) {
      const s = await import("sqlite3");
      sqlite3 = s.default || s;
      const o = await import("sqlite");
      open = o.open;
    }
    
    const dbPath = path.join(DB_DIR, dbName.endsWith('.db') ? dbName : `${dbName}.db`);
    sqliteConn = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await sqliteConn.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        items TEXT NOT NULL,
        updatedAt INTEGER NOT NULL,
        lmeParams TEXT,
        materialPrices TEXT,
        exchangeRate REAL
      )
    `);
    activeSqliteDb = dbName;
    activeDbType = 'sqlite';
    console.log(`SQLite initialized: ${dbName}`);
  } catch (error) {
    console.error("SQLite initialization failed:", error);
    throw error;
  }
}

// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is alive" });
});

// LME Prices Scraper Route
app.get("/api/lme-prices", async (req, res) => {
  try {
    const fetchHtml = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('https://www.westmetall.com/en/markdaten.php', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) return null;
        const data = await response.json();
        return data.rates.IDR;
      } catch (e) {
        return null;
      }
    };

    const [html, exchangeRate] = await Promise.all([fetchHtml(), fetchExchangeRate()]);
    
    // Extract Date
    const dateMatch = html.match(/<th class="number">([^<]+)<\/th>/);
    const date = dateMatch ? dateMatch[1].trim() : 'Unknown Date';

    // Extract Copper Price (Settlement Kasse)
    const cuMatch = html.match(/Copper\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]+>\s*([\d,.]+)\s*<\/a>/);
    const cuPrice = cuMatch ? parseFloat(cuMatch[1].replace(/,/g, '')) : null;

    // Extract Aluminium Price (Settlement Kasse)
    const alMatch = html.match(/Aluminium\s*<\/a>\s*<\/td>\s*<td>\s*<a[^>]+>\s*([\d,.]+)\s*<\/a>/);
    const alPrice = alMatch ? parseFloat(alMatch[1].replace(/,/g, '')) : null;

    res.json({
      success: true,
      date,
      copper: cuPrice,
      aluminium: alPrice,
      exchangeRate
    });
  } catch (error) {
    console.error("Error fetching LME prices:", error);
    // Fallback data if fetch fails
    res.json({
      success: true,
      date: new Date().toLocaleDateString(),
      copper: 9500, // Reasonable fallback
      aluminium: 2500, // Reasonable fallback
      exchangeRate: 15800, // Reasonable fallback for IDR
      isFallback: true
    });
  }
});

// Database Management Routes
app.get("/api/databases", (req, res) => {
  const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.db'));
  res.json({
    activeType: activeDbType,
    activeDb: activeSqliteDb,
    sqliteFiles: files,
    mysqlAvailable: !!mysqlPool
  });
});

app.post("/api/databases", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  
  try {
    await initSqlite(name);
    res.json({ success: true, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to create database" });
  }
});

app.post("/api/databases/select", async (req, res) => {
  const { type, name } = req.body;
  
  try {
    if (type === 'mysql') {
      if (!mysqlPool) await initMysql();
      activeDbType = 'mysql';
      activeSqliteDb = null;
    } else {
      await initSqlite(name);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to select database" });
  }
});

app.delete("/api/databases/:name", (req, res) => {
  const { name } = req.params;
  const dbPath = path.join(DB_DIR, name.endsWith('.db') ? name : `${name}.db`);
  
  if (activeSqliteDb === name) {
    activeSqliteDb = null;
    activeDbType = 'mysql';
  }
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Database not found" });
  }
});

// Project Routes (Unified)
app.get("/api/projects", async (req, res) => {
  try {
    let rows: any[] = [];
    if (activeDbType === 'mysql' && mysqlPool) {
      const [mysqlRows] = await mysqlPool.query("SELECT * FROM projects ORDER BY updatedAt DESC");
      rows = mysqlRows as any[];
    } else if (activeDbType === 'sqlite' && sqliteConn) {
      rows = await sqliteConn.all("SELECT * FROM projects ORDER BY updatedAt DESC");
    } else {
      return res.json([]);
    }
    
    const projects = rows.map(row => ({
      id: row.id,
      name: row.name,
      items: JSON.parse(row.items),
      updatedAt: row.updatedAt,
      lmeParams: row.lmeParams ? JSON.parse(row.lmeParams) : null,
      materialPrices: row.materialPrices ? JSON.parse(row.materialPrices) : null,
      exchangeRate: row.exchangeRate
    }));
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { id, name, items, updatedAt, lmeParams, materialPrices, exchangeRate } = req.body;
    const itemsJson = JSON.stringify(items);
    const lmeParamsJson = lmeParams ? JSON.stringify(lmeParams) : null;
    const materialPricesJson = materialPrices ? JSON.stringify(materialPrices) : null;
    
    if (activeDbType === 'mysql' && mysqlPool) {
      const query = `
        INSERT INTO projects (id, name, items, updatedAt, lmeParams, materialPrices, exchangeRate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          items = VALUES(items),
          updatedAt = VALUES(updatedAt),
          lmeParams = VALUES(lmeParams),
          materialPrices = VALUES(materialPrices),
          exchangeRate = VALUES(exchangeRate)
      `;
      await mysqlPool.query(query, [id, name, itemsJson, updatedAt, lmeParamsJson, materialPricesJson, exchangeRate]);
    } else if (activeDbType === 'sqlite' && sqliteConn) {
      await sqliteConn.run(`
        INSERT INTO projects (id, name, items, updatedAt, lmeParams, materialPrices, exchangeRate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          items = excluded.items,
          updatedAt = excluded.updatedAt,
          lmeParams = excluded.lmeParams,
          materialPrices = excluded.materialPrices,
          exchangeRate = excluded.exchangeRate
      `, [id, name, itemsJson, updatedAt, lmeParamsJson, materialPricesJson, exchangeRate]);
    } else {
      throw new Error("No active database");
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ error: "Failed to save project" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (activeDbType === 'mysql' && mysqlPool) {
      await mysqlPool.query("DELETE FROM projects WHERE id = ?", [id]);
    } else if (activeDbType === 'sqlite' && sqliteConn) {
      await sqliteConn.run("DELETE FROM projects WHERE id = ?", [id]);
    } else {
      throw new Error("No active database");
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

async function startServer() {
  console.log("Starting server...");
  
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // SPA fallback
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("Setting up production static serving...");
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Init DBs in background AFTER server starts listening
  setTimeout(async () => {
    try {
      await initMysql();
      const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.db'));
      if (files.length > 0) {
        await initSqlite(files[0]);
      }
    } catch (err) {
      console.error("Background DB initialization failed:", err);
    }
  }, 1000);
}

startServer();
