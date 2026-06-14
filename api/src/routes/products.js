const express = require("express");
const db = require("../db");

const router = express.Router();

// Colonnes du catalogue. Centralisé ici pour rester cohérent.
// NOTE: l'incident contrôlé du TP consiste à introduire ici une colonne
// inexistante (ex: ajouter "stock_qty"), ce qui casse la requête et fait
// échouer products.test.js. Le rollback (git revert) restaure cette ligne.
const PRODUCT_COLUMNS = "id, name, description, price_cents";

// GET /products : liste du catalogue.
// Supporte un paramètre optionnel ?limit (entier positif) -> 400 si invalide.
router.get("/", async (req, res, next) => {
  try {
    let limitClause = "";
    const params = [];

    if (req.query.limit !== undefined) {
      const limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit <= 0) {
        return res.status(400).json({ error: "limit doit être un entier positif" });
      }
      params.push(limit);
      limitClause = ` LIMIT $${params.length}`;
    }

    // Interrupteur d'incident contrôlé pilotable sans modifier le code
    // (utile pour casser un conteneur staging déjà déployé).
    const columns =
      process.env.SIMULATE_INCIDENT === "true"
        ? `${PRODUCT_COLUMNS}, stock_qty`
        : PRODUCT_COLUMNS;

    const result = await db.query(
      `SELECT ${columns} FROM products ORDER BY id${limitClause}`,
      params
    );

    res.json({
      source: "database",
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /products/:id : un produit. 400 si id non entier, 404 si introuvable.
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "id doit être un entier positif" });
    }

    const result = await db.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "produit introuvable" });
    }

    res.json({ source: "database", data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
