const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const { getVersion } = require("./version");
const healthRoutes = require("./routes/health");
const readyRoutes = require("./routes/ready");
const productRoutes = require("./routes/products");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.json({
    name: "ShopLite API",
    version: getVersion(),
    endpoints: ["/health", "/ready", "/products"]
  });
});

app.use("/health", healthRoutes);
app.use("/ready", readyRoutes);
app.use("/products", productRoutes);

// 404 : route inconnue.
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Gestionnaire d'erreurs : log JSON structuré + réponse 500 générique.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.log("ERROR", {
    request_id: req.requestId,
    message: "unhandled_error",
    error: err.message,
    path: req.originalUrl
  });

  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
