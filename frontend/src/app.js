const healthEl = document.querySelector("#health");
const productsEl = document.querySelector("#products");
const statusDotEl = document.querySelector("#status-dot");
const statusTitleEl = document.querySelector("#status-title");
const statusMessageEl = document.querySelector("#status-message");
const productCountEl = document.querySelector("#product-count");
const refreshButton = document.querySelector("#refresh-button");

function formatPrice(priceCents) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(priceCents / 100);
}

function setStatus(type, title, message) {
  statusDotEl.className = `status-dot ${type}`;
  statusTitleEl.textContent = title;
  statusMessageEl.textContent = message;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} a retourne le statut ${response.status}`);
  }

  return response.json();
}

async function loadHealth() {
  setStatus("pending", "Verification en cours", "Appel de /api/health...");
  healthEl.textContent = "Chargement...";

  const data = await fetchJson("/api/health");
  healthEl.textContent = JSON.stringify(data, null, 2);

  if (data.status === "ok" && data.checks?.database === "ok") {
    setStatus("ok", "Application operationnelle", "API et PostgreSQL repondent correctement.");
    return;
  }

  setStatus("error", "Application degradee", "L'API repond, mais une verification est en erreur.");
}

async function loadProducts() {
  productCountEl.textContent = "Chargement";

  const payload = await fetchJson("/api/products");
  const products = payload.data || [];

  productCountEl.textContent = `${products.length} produit${products.length > 1 ? "s" : ""}`;

  if (products.length === 0) {
    productsEl.innerHTML = `<div class="error-box">Aucun produit disponible.</div>`;
    return;
  }

  productsEl.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <span class="price">${formatPrice(product.price_cents)}</span>
        </article>
      `
    )
    .join("");
}

async function refreshDashboard() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Actualisation...";

  try {
    await Promise.all([loadHealth(), loadProducts()]);
  } catch (error) {
    setStatus("error", "Erreur de connexion", error.message);
    healthEl.textContent = error.message;
    productsEl.innerHTML = `<div class="error-box">${error.message}</div>`;
    productCountEl.textContent = "Erreur";
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Rafraichir";
  }
}

refreshButton.addEventListener("click", refreshDashboard);
refreshDashboard();
