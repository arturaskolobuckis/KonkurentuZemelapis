function loadCss(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Nepavyko įkelti ${src}`));
    document.body.appendChild(script);
  });
}

async function startApp() {
  const hasGoogleKey = Boolean(String(window.APP_CONFIG?.googleMapsApiKey || "").trim());

  if (hasGoogleKey) {
    await loadScript("https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js");
    await loadScript("app-google.js");
    return;
  }

  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  loadCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
  loadCss("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  await loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
  await loadScript("app.js");
}

startApp().catch((error) => {
  const companyList = document.getElementById("companyList");
  if (companyList) {
    companyList.innerHTML = `<div class="company-item"><strong>Klaida</strong><span>${error.message}</span></div>`;
  }
});
