const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => res.send("GREEN LION API running"));

// Simple test routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, message: err.message || "Server error" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Simple Server running on port ${PORT}`));
