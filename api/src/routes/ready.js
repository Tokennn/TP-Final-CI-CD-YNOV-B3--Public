const express = require("express");
const db = require("../db");
const { getVersion } = require("../version");

const router = express.Router();

// /ready : readiness probe.
// Renvoie 200 uniquement si l'API ET la base sont prêtes à servir du trafic.
// Utilisé par le healthcheck Compose pour conditionner le démarrage des dépendances.
router.get("/", async (req, res) => {
  const checks = { api: "up", database: "down" };
  let ready = true;

  try {
    await db.query("SELECT 1");
    checks.database = "up";
  } catch (error) {
    checks.database = "down";
    ready = false;
  }

  res.status(ready ? 200 : 503).json({
    ready,
    version: getVersion(),
    checks,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
