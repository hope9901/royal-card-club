import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite Database at", dbPath);
    // Create Table if not exists
    db.run(
      `CREATE TABLE IF NOT EXISTS rankings (
        name TEXT PRIMARY KEY,
        maxBalance INTEGER NOT NULL,
        date TEXT NOT NULL
      )`,
      (tableErr) => {
        if (tableErr) {
          console.error("Table creation error:", tableErr.message);
        } else {
          console.log("Rankings table verified / initialized.");
        }
      }
    );
  }
});

// API Endpoint 1: Get Top 50 Rankings
app.get("/api/rankings", (req, res) => {
  const query = "SELECT name, maxBalance, date FROM rankings ORDER BY maxBalance DESC LIMIT 50";
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API Endpoint 2: Register/Update Ranking
app.post("/api/rankings", (req, res) => {
  const { name, maxBalance } = req.body;

  if (!name || name.trim().length < 2 || name.trim().length > 8) {
    return res.status(400).json({ error: "닉네임은 2자 이상 8자 이하로 입력되어야 합니다." });
  }

  if (typeof maxBalance !== "number" || maxBalance < 0) {
    return res.status(400).json({ error: "올바르지 않은 자산 금액입니다." });
  }

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  // Check if player record already exists
  const checkQuery = "SELECT maxBalance FROM rankings WHERE name = ?";
  db.get(checkQuery, [name], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Update only if the new balance is higher
      if (maxBalance > row.maxBalance) {
        const updateQuery = "UPDATE rankings SET maxBalance = ?, date = ? WHERE name = ?";
        db.run(updateQuery, [maxBalance, todayStr, name], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: updateErr.message });
          }
          res.json({ message: "랭킹 기록이 갱신되었습니다.", updated: true });
        });
      } else {
        res.json({ message: "기존 랭킹 점수가 더 높습니다.", updated: false });
      }
    } else {
      // Insert new record
      const insertQuery = "INSERT INTO rankings (name, maxBalance, date) VALUES (?, ?, ?)";
      db.run(insertQuery, [name, maxBalance, todayStr], (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: insertErr.message });
        }
        res.status(201).json({ message: "신규 랭커가 등록되었습니다.", updated: true });
      });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
