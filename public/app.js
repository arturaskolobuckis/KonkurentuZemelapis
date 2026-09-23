const map = L.map("map", {
  center: [55.12, 23.08],
  zoom: 7,
  preferCanvas: true,
  zoomControl: false
});

const COVERAGE_TARGETS = [
  { companyId: "betono-centras-vilnius", label: "Riovonių 15 km keliais", color: "#0f766e" },
  { companyId: "betono-centras-vilnius-metalo", label: "Metalo 15 km keliais", color: "#2563eb" },
  { companyId: "betono-centras-vilnius-zariju", label: "Žarijų 15 km keliais", color: "#d97706" }
];

const zoomButtons = L.DomUtil.create("div", "map-zoom-control", map.getContainer());
const zoomIn = L.DomUtil.create("button", "", zoomButtons);
const zoomOut = L.DomUtil.create("button", "", zoomButtons);
const coverageControls = L.DomUtil.create("div", "map-coverage-control", map.getContainer());
const layerControls = L.DomUtil.create("div", "map-layer-control", map.getContainer());
const coverageButtons = new Map();
const coverageLayers = new Map();
const layerButtons = new Map();

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

L.DomEvent.disableClickPropagation(coverageControls);
L.DomEvent.disableScrollPropagation(coverageControls);
L.DomEvent.disableClickPropagation(layerControls);
L.DomEvent.disableScrollPropagation(layerControls);

for (const target of COVERAGE_TARGETS) {
  const button = L.DomUtil.create("button", "map-coverage-toggle", coverageControls);
  button.type = "button";
  button.textContent = target.label;
  button.title = `Rodyti arba paslėpti automobiliu pasiekiamą ${target.label} zoną`;
  button.setAttribute("aria-label", `Rodyti arba paslėpti automobiliu pasiekiamą ${target.label} zoną`);
  button.setAttribute("aria-pressed", "false");
  button.style.setProperty("--coverage-color", target.color);
  L.DomEvent.on(button, "click", () => toggleCoverage(target.companyId));
  coverageButtons.set(target.companyId, button);
}

const satelliteLayer = L.layerGroup([
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
    }
  ),
  L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Road labels &copy; Esri",
      pane: "overlayPane"
    }
  ),
  L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Labels &copy; Esri",
      pane: "overlayPane"
    }
  )
]);

const terrainLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Topographic map &copy; Esri and contributors"
  }
);

const baseLayers = new Map([
  ["terrain", terrainLayer],
  ["satellite", satelliteLayer]
]);
let activeBaseLayer = "satellite";

for (const option of [
  { id: "terrain", label: "Reljefas" },
  { id: "satellite", label: "Palydovas" }
]) {
  const button = L.DomUtil.create("button", "map-layer-toggle", layerControls);
  button.type = "button";
  button.textContent = option.label;
  button.title = `Rodyti sluoksnį: ${option.label}`;
  button.setAttribute("aria-label", `Rodyti sluoksnį: ${option.label}`);
  button.setAttribute("aria-pressed", String(option.id === activeBaseLayer));
  button.classList.toggle("is-active", option.id === activeBaseLayer);
  L.DomEvent.on(button, "click", () => setBaseLayer(option.id));
  layerButtons.set(option.id, button);
}

satelliteLayer.addTo(map);

const clusterLayer = L.markerClusterGroup({
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true
});

const cityFilter = document.getElementById("cityFilter");
const activityFilter = document.getElementById("activityFilter");
const completenessFilter = document.getElementById("completenessFilter");
const searchInput = document.getElementById("searchInput");
const companyList = document.getElementById("companyList");
const companyCount = document.getElementById("companyCount");
const cityCount = document.getElementById("cityCount");

let companies = [];
let markers = new Map();
let driveZones = new Map();

function setBaseLayer(layerId) {
  if (layerId === activeBaseLayer) return;
  const nextLayer = baseLayers.get(layerId);
  if (!nextLayer) return;
  const currentLayer = baseLayers.get(activeBaseLayer);
  if (currentLayer && map.hasLayer(currentLayer)) map.removeLayer(currentLayer);
  nextLayer.addTo(map);
  activeBaseLayer = layerId;
  for (const [id, button] of layerButtons) {
    const isActive = id === activeBaseLayer;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function toggleCoverage(companyId) {
  const button = coverageButtons.get(companyId);
  const existingLayer = coverageLayers.get(companyId);
  if (existingLayer) {
    map.removeLayer(existingLayer);
    coverageLayers.delete(companyId);
    button?.classList.remove("is-active");
    button?.setAttribute("aria-pressed", "false");
    return;
  }

  const feature = driveZones.get(companyId);
  if (!feature) return;
  const color = feature.properties?.color || "#0f766e";
  const zone = L.geoJSON(feature, {
    style: {
      color,
      weight: 2,
      opacity: 0.85,
      fillColor: color,
      fillOpacity: 0.14
    },
    interactive: false
  }).addTo(map);
  coverageLayers.set(companyId, zone);
  button?.classList.add("is-active");
  button?.setAttribute("aria-pressed", "true");
  map.fitBounds(zone.getBounds(), { padding: [24, 24] });
}

function addDriveZoneAttribution() {
  map.attributionControl.addAttribution(
    'Važiavimo zonos &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, Valhalla'
  );
}

function validateDriveZones(payload) {
  const features = payload.features || [];
  const zones = new Map(
    features
      .filter((feature) => feature.properties?.company_id)
      .map((feature) => [feature.properties.company_id, feature])
  );
  for (const target of COVERAGE_TARGETS) {
    if (!zones.has(target.companyId)) {
      throw new Error(`Nerasta 15 km važiavimo zona: ${target.label}`);
    }
  }
  return zones;
}

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
  markers.clear();
  refreshMapSize();

  for (const company of items) {
    if (!Number.isFinite(company.latitude) || !Number.isFinite(company.longitude)) continue;
    const marker = L.marker([company.latitude, company.longitude], {
      icon: markerIcon(company),
      title: company.brand || company.name
    }).bindPopup(popupHtml(company));
    markers.set(company.company_id, marker);
    clusterLayer.addLayer(marker);
  }

  if (!map.hasLayer(clusterLayer)) map.addLayer(clusterLayer);
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
  const [companiesResponse, zonesResponse] = await Promise.all([
    fetch("data/companies.json", { cache: "no-store" }),
    fetch("data/drive-zones-15km.geojson", { cache: "no-store" })
  ]);
  if (!companiesResponse.ok) throw new Error(`Nepavyko įkelti duomenų: ${companiesResponse.status}`);
  if (!zonesResponse.ok) throw new Error(`Nepavyko įkelti važiavimo zonų: ${zonesResponse.status}`);
  const [companiesPayload, zonesPayload] = await Promise.all([
    companiesResponse.json(),
    zonesResponse.json()
  ]);
  companies = companiesPayload.companies || [];
  driveZones = validateDriveZones(zonesPayload);
  addDriveZoneAttribution();
  populateFilters();
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
