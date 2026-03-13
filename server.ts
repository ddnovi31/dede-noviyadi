import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'projects.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items TEXT NOT NULL,
    updatedAt INTEGER NOT NULL
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/projects', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC');
      const rows = stmt.all();
      const projects = rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        items: JSON.parse(row.items),
        updatedAt: row.updatedAt
      }));
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const { id, name, items, updatedAt } = req.body;
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, items, updatedAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          items = excluded.items,
          updatedAt = excluded.updatedAt
      `);
      stmt.run(id, name, JSON.stringify(items), updatedAt);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving project:', error);
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  app.post('/api/projects/reset', (req, res) => {
    try {
      db.exec('DELETE FROM projects');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing projects:', error);
      res.status(500).json({ error: 'Failed to clear projects' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
