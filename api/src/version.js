const pkg = require("../package.json");

// La version exposée par l'API.
// Priorité à APP_VERSION (injectée par Docker/Compose/CD selon le tag déployé),
// sinon on retombe sur la version du package.json.
function getVersion() {
  return process.env.APP_VERSION || pkg.version;
}

module.exports = { getVersion };
