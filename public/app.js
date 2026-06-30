const map = L.map("map", {
  center: [55.12, 23.08],
  zoom: 7,
  preferCanvas: true,
  zoomControl: true
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

const cityFilter = document.getElementById("cityFilter");
const activityFilter = document.getElementById("activityFilter");
const completenessFilter = document.getElementById("completenessFilter");
const searchInput = document.getElementById("searchInput");
const companyList = document.getElementById("companyList");
const companyCount = document.getElementById("companyCount");
const cityCount = document.getElementById("cityCount");

let companies = [];
let markers = new Map();

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
  const revenue = company.revenue_latest
    ? `${Number(company.revenue_latest).toLocaleString("lt-LT")} EUR`
    : "Nėra duomenų";
  const employees = company.employees_latest ?? "Nėra duomenų";
  const vehicles = company.vehicles_latest ?? "Nėra duomenų";
  const capacity = company.concrete_plant_capacity || "Nėra duomenų";
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
        <dt>Mazgas</dt><dd>${escapeHtml(plantName)}</dd>
        <dt>Našumas</dt><dd>${escapeHtml(capacity)}</dd>
        <dt>Aprašymas</dt><dd>${escapeHtml(description)}</dd>
        <dt>Apyvarta</dt><dd>${escapeHtml(revenue)}</dd>
        <dt>Darbuotojai</dt><dd>${escapeHtml(employees)}</dd>
        <dt>Transportas</dt><dd>${escapeHtml(vehicles)}</dd>
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
    const needsManual = !company.concrete_plant_name || !company.concrete_plant_capacity || !company.revenue_latest || !company.employees_latest || !company.vehicles_latest;
    const completenessOk =
      selectedCompleteness === "all" ||
      (selectedCompleteness === "needs_manual" && needsManual) ||
      (selectedCompleteness === "has_plant_name" && Boolean(company.concrete_plant_name)) ||
      (selectedCompleteness === "has_capacity" && Boolean(company.concrete_plant_capacity));
    const text = `${company.name} ${company.brand} ${company.address} ${company.city} ${company.concrete_plant_name}`.toLowerCase();
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
      <span>${escapeHtml(company.concrete_plant_name || "Mazgo pavadinimą reikia papildyti")}</span>
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
  const response = await fetch("data/companies.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Nepavyko įkelti duomenų: ${response.status}`);
  const payload = await response.json();
  companies = payload.companies || [];
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
