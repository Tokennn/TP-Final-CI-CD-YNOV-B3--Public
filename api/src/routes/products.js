const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, name, description, price_cents FROM products ORDER BY id"
    );

    res.json({
      source: "database",
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
