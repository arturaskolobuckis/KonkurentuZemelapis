const map = L.map("map", {
  center: [55.12, 23.08],
  zoom: 7,
  preferCanvas: true,
  zoomControl: false
});

const COVERAGE_RADIUS_METERS = 35000;

const zoomButtons = L.DomUtil.create("div", "map-zoom-control", map.getContainer());
const zoomIn = L.DomUtil.create("button", "", zoomButtons);
const zoomOut = L.DomUtil.create("button", "", zoomButtons);
const coverageButton = L.DomUtil.create("button", "map-coverage-toggle", map.getContainer());

zoomIn.type = "button";
zoomIn.textContent = "+";
zoomIn.title = "Priartinti";
zoomIn.setAttribute("aria-label", "Priartinti žemėlapį");

zoomOut.type = "button";
zoomOut.textContent = "-";
zoomOut.title = "Atitolinti";
zoomOut.setAttribute("aria-label", "Atitolinti žemėlapį");

L.DomEvent.disableClickPropagation(zoomButtons);
L.DomEvent.disableScrollPropagation(zoomButtons);
L.DomEvent.on(zoomIn, "click", () => map.zoomIn());
L.DomEvent.on(zoomOut, "click", () => map.zoomOut());

coverageButton.type = "button";
coverageButton.textContent = "35 km";
coverageButton.title = "Rodyti arba paslėpti 35 km zonas";
coverageButton.setAttribute("aria-label", "Rodyti arba paslėpti 35 km zonas");
coverageButton.setAttribute("aria-pressed", "false");

L.DomEvent.disableClickPropagation(coverageButton);
L.DomEvent.disableScrollPropagation(coverageButton);
L.DomEvent.on(coverageButton, "click", () => {
  setCoverageVisible(!coverageVisible);
});

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
  }
).addTo(map);

L.tileLayer(
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Road labels &copy; Esri",
    pane: "overlayPane"
  }
).addTo(map);

L.tileLayer(
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Labels &copy; Esri",
    pane: "overlayPane"
  }
).addTo(map);

const clusterLayer = L.markerClusterGroup({
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true
});
const coverageLayer = L.layerGroup();

const cityFilter = document.getElementById("cityFilter");
const activityFilter = document.getElementById("activityFilter");
const completenessFilter = document.getElementById("completenessFilter");
const searchInput = document.getElementById("searchInput");
const companyList = document.getElementById("companyList");
const companyCount = document.getElementById("companyCount");
const cityCount = document.getElementById("cityCount");

let companies = [];
let markers = new Map();
let coverageVisible = false;

function refreshMapSize() {
  map.invalidateSize({ animate: false });
}

function markerIcon(company) {
  const isReady = company.activity_type === "ready_mix_concrete";
  return L.divIcon({
    className: "",
    html: `<div class="${isReady ? "marker-ready" : "marker-precast"}">${isReady ? "B" : "G"}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
}

function updateCoverageButton() {
  coverageButton.classList.toggle("is-active", coverageVisible);
  coverageButton.setAttribute("aria-pressed", String(coverageVisible));
}

function coverageCircle(center) {
  return L.circle(center, {
    radius: COVERAGE_RADIUS_METERS,
    color: "#0f766e",
    weight: 2,
    opacity: 0.72,
    fillColor: "#0f766e",
    fillOpacity: 0.12,
    interactive: false
  });
}

function setCoverageVisible(visible) {
  coverageVisible = visible;
  updateCoverageButton();
  if (coverageVisible) {
    if (!map.hasLayer(coverageLayer)) map.addLayer(coverageLayer);
  } else if (map.hasLayer(coverageLayer)) {
    map.removeLayer(coverageLayer);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function popupHtml(company) {
  const capacity = company.concrete_plant_capacity || "Nėra duomenų";
  const mixer = company.concrete_plant_mixer || "Nėra duomenų";
  const silosCount = company.concrete_plant_silos_count || "Nėra duomenų";
  const plantName = company.concrete_plant_name || "Reikia papildyti";
  const description = company.concrete_plant_description || "Nėra viešo aprašymo";
  return `
    <div class="popup">
      <h2>${escapeHtml(company.brand || company.name)}</h2>
      <dl>
        <dt>Įmonė</dt><dd>${escapeHtml(company.name)}</dd>
        <dt>Veikla</dt><dd>${escapeHtml(company.activity_label)}</dd>
        <dt>Miestas</dt><dd>${escapeHtml(company.city)}</dd>
        <dt>Adresas</dt><dd>${escapeHtml(company.address)}</dd>
        <dt>Mazgas (gamintojas)</dt><dd>${escapeHtml(plantName)}</dd>
        <dt>Maišyklė</dt><dd>${escapeHtml(mixer)}</dd>
        <dt>Našumas (realus)</dt><dd>${escapeHtml(capacity)}</dd>
        <dt>Silosai</dt><dd>${escapeHtml(silosCount)}</dd>
        <dt>Aprašymas</dt><dd>${escapeHtml(description)}</dd>
        <dt>Šaltinis</dt><dd><a href="${escapeHtml(company.source_url)}" target="_blank" rel="noreferrer">Atidaryti</a></dd>
      </dl>
    </div>
  `;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "lt"));
}

function populateFilters() {
  for (const city of uniqueSorted(companies.map((item) => item.city))) {
    cityFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`);
  }
  for (const activity of uniqueSorted(companies.map((item) => item.activity_label))) {
    activityFilter.insertAdjacentHTML(
      "beforeend",
      `<option value="${escapeHtml(activity)}">${escapeHtml(activity)}</option>`
    );
  }
}

function filteredCompanies() {
  const selectedCity = cityFilter.value;
  const selectedActivity = activityFilter.value;
  const selectedCompleteness = completenessFilter.value;
  const query = searchInput.value.trim().toLowerCase();
  return companies.filter((company) => {
    const cityOk = selectedCity === "all" || company.city === selectedCity;
    const activityOk = selectedActivity === "all" || company.activity_label === selectedActivity;
    const needsManual = !company.concrete_plant_name || !company.concrete_plant_mixer || !company.concrete_plant_capacity || !company.concrete_plant_silos_count;
    const completenessOk =
      selectedCompleteness === "all" ||
      (selectedCompleteness === "needs_manual" && needsManual) ||
      (selectedCompleteness === "has_plant_name" && Boolean(company.concrete_plant_name)) ||
      (selectedCompleteness === "has_capacity" && Boolean(company.concrete_plant_capacity)) ||
      (selectedCompleteness === "has_silos_count" && Boolean(company.concrete_plant_silos_count));
    const text = `${company.name} ${company.brand} ${company.address} ${company.city} ${company.concrete_plant_name} ${company.concrete_plant_mixer} ${company.concrete_plant_capacity} ${company.concrete_plant_silos_count}`.toLowerCase();
    const searchOk = !query || text.includes(query);
    return cityOk && activityOk && completenessOk && searchOk;
  });
}

function renderList(items) {
  companyList.innerHTML = "";
  if (items.length === 0) {
    companyList.innerHTML = '<div class="company-item"><strong>Nėra rezultatų</strong><span>Pakeiskite filtrus.</span></div>';
    return;
  }

  for (const company of items) {
    const button = document.createElement("button");
    button.className = "company-item";
    button.type = "button";
    button.innerHTML = `
      <strong>${escapeHtml(company.brand || company.name)}</strong>
      <span>${escapeHtml(company.city)} - ${escapeHtml(company.address)}</span>
      <span>${escapeHtml(company.concrete_plant_name || "Mazgo gamintoją reikia papildyti")}</span>
      <span>Maišyklė: ${escapeHtml(company.concrete_plant_mixer || "nėra duomenų")} · Našumas (realus): ${escapeHtml(company.concrete_plant_capacity || "nėra duomenų")} · Silosai: ${escapeHtml(company.concrete_plant_silos_count || "nėra duomenų")}</span>
      <span class="activity-pill">${escapeHtml(company.activity_label)}</span>
    `;
    button.addEventListener("click", () => {
      const marker = markers.get(company.company_id);
      if (!marker) return;
      refreshMapSize();
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 10), { animate: false });
      marker.openPopup();
      window.setTimeout(refreshMapSize, 0);
    });
    companyList.appendChild(button);
  }
}

function renderMap() {
  const items = filteredCompanies();
  clusterLayer.clearLayers();
  coverageLayer.clearLayers();
  markers.clear();
  refreshMapSize();

  for (const company of items) {
    if (!Number.isFinite(company.latitude) || !Number.isFinite(company.longitude)) continue;
    const marker = L.marker([company.latitude, company.longitude], {
      icon: markerIcon(company),
      title: company.brand || company.name
    }).bindPopup(popupHtml(company));
    coverageLayer.addLayer(coverageCircle([company.latitude, company.longitude]));
    markers.set(company.company_id, marker);
    clusterLayer.addLayer(marker);
  }

  if (!map.hasLayer(clusterLayer)) map.addLayer(clusterLayer);
  if (coverageVisible && !map.hasLayer(coverageLayer)) map.addLayer(coverageLayer);
  if (!coverageVisible && map.hasLayer(coverageLayer)) map.removeLayer(coverageLayer);
  if (clusterLayer.getLayers().length > 0) {
    map.fitBounds(clusterLayer.getBounds(), { padding: [32, 32], maxZoom: 11 });
  }

  companyCount.textContent = String(items.length);
  cityCount.textContent = String(uniqueSorted(items.map((item) => item.city)).length);
  renderList(items);
  window.setTimeout(refreshMapSize, 0);
  window.setTimeout(refreshMapSize, 250);
}

async function init() {
  const response = await fetch("data/companies.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Nepavyko įkelti duomenų: ${response.status}`);
  const payload = await response.json();
  companies = payload.companies || [];
  populateFilters();
  updateCoverageButton();
  renderMap();
}

cityFilter.addEventListener("change", renderMap);
activityFilter.addEventListener("change", renderMap);
completenessFilter.addEventListener("change", renderMap);
searchInput.addEventListener("input", renderMap);

init().catch((error) => {
  companyList.innerHTML = `<div class="company-item"><strong>Klaida</strong><span>${escapeHtml(error.message)}</span></div>`;
});

window.addEventListener("resize", refreshMapSize);
