const request = require("supertest");

// On mocke la base : ces tests unitaires tournent partout (local, CI)
// sans dépendre d'un PostgreSQL réel.
jest.mock("../src/db");
const db = require("../src/db");
const app = require("../src/app");

beforeEach(() => {
  db.query.mockReset();
});

test("GET / retourne le nom et la version de l'API", async () => {
  const response = await request(app).get("/");

  expect(response.status).toBe(200);
  expect(response.body.name).toBe("ShopLite API");
  expect(response.body.version).toBeDefined();
});

test("GET /health renvoie 200 et database ok quand la DB répond", async () => {
  db.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

  const response = await request(app).get("/health");

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("ok");
  expect(response.body.checks.database).toBe("ok");
  expect(response.body.version).toBeDefined();
  expect(response.body.timestamp).toBeDefined();
});

test("GET /health renvoie 503 quand la DB est injoignable", async () => {
  db.query.mockRejectedValue(new Error("connection refused"));

  const response = await request(app).get("/health");

  expect(response.status).toBe(503);
  expect(response.body.checks.database).toBe("error");
});

test("GET /ready renvoie 200 quand l'API et la DB sont prêtes", async () => {
  db.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

  const response = await request(app).get("/ready");

  expect(response.status).toBe(200);
  expect(response.body.ready).toBe(true);
});

test("GET /ready renvoie 503 quand la DB n'est pas prête", async () => {
  db.query.mockRejectedValue(new Error("not ready"));

  const response = await request(app).get("/ready");

  expect(response.status).toBe(503);
  expect(response.body.ready).toBe(false);
});

test("Une route inconnue renvoie 404", async () => {
  const response = await request(app).get("/route-inexistante");

  expect(response.status).toBe(404);
  expect(response.body.error).toBe("Route not found");
});

test("Chaque réponse porte un header X-Request-Id", async () => {
  db.query.mockResolvedValue({ rows: [] });

  const response = await request(app).get("/health");

  expect(response.headers["x-request-id"]).toBeDefined();
});
