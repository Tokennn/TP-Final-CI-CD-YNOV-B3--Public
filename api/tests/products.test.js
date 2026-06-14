const request = require("supertest");

jest.mock("../src/db");
const db = require("../src/db");
const app = require("../src/app");

const SAMPLE = [
  { id: 1, name: "Clavier compact", description: "...", price_cents: 5990 },
  { id: 2, name: "Souris precision", description: "...", price_cents: 3490 }
];

beforeEach(() => {
  db.query.mockReset();
});

test("GET /products renvoie la liste depuis la base", async () => {
  db.query.mockResolvedValue({ rows: SAMPLE });

  const response = await request(app).get("/products");

  expect(response.status).toBe(200);
  expect(response.body.source).toBe("database");
  expect(response.body.count).toBe(2);
  expect(Array.isArray(response.body.data)).toBe(true);
  expect(response.body.data[0].name).toBe("Clavier compact");
});

test("GET /products?limit=abc renvoie 400 (validation)", async () => {
  const response = await request(app).get("/products?limit=abc");

  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/limit/);
  expect(db.query).not.toHaveBeenCalled();
});

test("GET /products?limit=2 transmet la limite à la requête", async () => {
  db.query.mockResolvedValue({ rows: SAMPLE });

  const response = await request(app).get("/products?limit=2");

  expect(response.status).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("LIMIT"), [2]);
});

test("GET /products/:id renvoie un produit", async () => {
  db.query.mockResolvedValue({ rows: [SAMPLE[0]] });

  const response = await request(app).get("/products/1");

  expect(response.status).toBe(200);
  expect(response.body.data.id).toBe(1);
});

test("GET /products/:id renvoie 404 si introuvable", async () => {
  db.query.mockResolvedValue({ rows: [] });

  const response = await request(app).get("/products/9999");

  expect(response.status).toBe(404);
  expect(response.body.error).toMatch(/introuvable/);
});

test("GET /products/:id renvoie 400 si id non entier", async () => {
  const response = await request(app).get("/products/abc");

  expect(response.status).toBe(400);
  expect(db.query).not.toHaveBeenCalled();
});

test("GET /products renvoie 500 si la base échoue (incident)", async () => {
  db.query.mockRejectedValue(new Error('column "stock_qty" does not exist'));

  const response = await request(app).get("/products");

  expect(response.status).toBe(500);
  expect(response.body.error).toBe("Internal server error");
});
