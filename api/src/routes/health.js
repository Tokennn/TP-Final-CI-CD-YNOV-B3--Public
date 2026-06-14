const express = require("express");
const db = require("../db");
const { getVersion } = require("../version");

const router = express.Router();

// /health : healthcheck détaillé.
// Indique l'état de l'API, l'état de la base, la version et un timestamp.
router.get("/", async (req, res) => {
  const checks = {
    api: "ok",
    database: "unknown"
  };

  let status = 200;

  try {
    await db.query("SELECT 1");
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    status = 503;
  }

  res.status(status).json({
    status: status === 200 ? "ok" : "error",
    service: "shoplite-api",
    version: getVersion(),
    checks,
    uptime_s: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
