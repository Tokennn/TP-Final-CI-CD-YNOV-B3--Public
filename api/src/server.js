require("dotenv").config();

const app = require("./app");
const logger = require("./middleware/logger");
const { getVersion } = require("./version");

const port = Number(process.env.API_PORT || process.env.PORT || 3000);

const server = app.listen(port, "0.0.0.0", () => {
  logger.log("INFO", {
    message: "ShopLite API started",
    version: getVersion(),
    port
  });
});

// Arrêt propre : permet à Docker de stopper le conteneur sans SIGKILL.
function shutdown(signal) {
  logger.log("INFO", { message: "shutdown", signal });
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
