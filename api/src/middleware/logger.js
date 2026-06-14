const crypto = require("crypto");

// Niveaux de log normalisés (du moins grave au plus grave).
const LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

// Clés considérées comme sensibles : leur valeur est masquée dans les logs.
const SENSITIVE_KEYS = [
  "password",
  "pass",
  "token",
  "authorization",
  "secret",
  "apikey",
  "api_key",
  "database_url",
  "connectionstring",
  "connection_string"
];

// Remplace les valeurs sensibles par "***" (récursif sur les objets).
function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      clean[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? "***" : sanitize(val);
    }
    return clean;
  }

  if (typeof value === "string") {
    // Masque une éventuelle chaîne de connexion postgres://user:password@host
    return value.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1***$3");
  }

  return value;
}

// Émet une ligne de log JSON structurée sur stdout.
function log(level, fields = {}) {
  const normalized = LEVELS.includes(level) ? level : "INFO";
  process.stdout.write(
    JSON.stringify({
      level: normalized,
      timestamp: new Date().toISOString(),
      ...sanitize(fields)
    }) + "\n"
  );
}

// Middleware Express : attribue un request_id et logge chaque requête terminée.
function logger(req, res, next) {
  const startedAt = Date.now();
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const level =
      res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    log(level, {
      request_id: requestId,
      message: "http_request",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - startedAt
    });
  });

  next();
}

module.exports = logger;
module.exports.log = log;
module.exports.sanitize = sanitize;
module.exports.LEVELS = LEVELS;
