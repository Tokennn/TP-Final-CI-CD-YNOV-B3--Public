const request = require("supertest");

// Test d'intégration contre un VRAI PostgreSQL.
// - En CI : DATABASE_URL pointe vers le service `postgres` du workflow.
// - En local : lancé contre la base Compose (ou ignoré si DATABASE_URL absent).
//
// C'est CE test qui devient ROUGE pendant l'incident contrôlé
// (colonne inexistante dans /products -> erreur SQL réelle -> 500)
// et qui REPASSE VERT après le rollback / git revert.
const runIntegration = !!process.env.DATABASE_URL;
const d = runIntegration ? describe : describe.skip;

d("Intégration /products avec PostgreSQL réel", () => {
  let app;
  let db;

  beforeAll(async () => {
    app = require("../src/app");
    db = require("../src/db");
    // Schéma + données minimales, idempotent.
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_cents INTEGER NOT NULL CHECK (price_cents > 0)
      );
    `);
    await db.query(`
      INSERT INTO products (name, description, price_cents)
      SELECT 'Clavier compact', 'Clavier de test', 5990
      WHERE NOT EXISTS (SELECT 1 FROM products);
    `);
  });

  afterAll(async () => {
    await db.getPool().end();
  });

  test("GET /products renvoie 200 et au moins un produit", async () => {
    const response = await request(app).get("/products");

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty("price_cents");
  });

  test("GET /health voit la base ok", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.checks.database).toBe("ok");
  });
});
