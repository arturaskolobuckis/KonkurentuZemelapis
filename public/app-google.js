const DEFAULT_CENTER = { lat: 55.12, lng: 23.08 };
const DEFAULT_ZOOM = 7;

const cityFilter = document.getElementById("cityFilter");
const activityFilter = document.getElementById("activityFilter");
const completenessFilter = document.getElementById("completenessFilter");
const searchInput = document.getElementById("searchInput");
const companyList = document.getElementById("companyList");
const companyCount = document.getElementById("companyCount");
const cityCount = document.getElementById("cityCount");
const mapElement = document.getElementById("map");

let companies = [];
let map;
let infoWindow;
let clusterLayer;
let markers = new Map();

function getGoogleMapsApiKey() {
  return String(window.APP_CONFIG?.googleMapsApiKey || "").trim();
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    window.__initGoogleMaps = () => resolve();

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(apiKey) +
      "&callback=__initGoogleMaps&language=lt&region=LT&v=weekly";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Nepavyko įkelti Google Maps."));
    document.head.appendChild(script);
  });
}

function showMapNotice(message) {
  mapElement.innerHTML = `
    <div class="map-notice">
      <strong>Google Maps dar neįjungtas</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
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
  cityFilter.length = 1;
  activityFilter.length = 1;

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
    const needsManual =
      !company.concrete_plant_name ||
      !company.concrete_plant_mixer ||
      !company.concrete_plant_capacity ||
      !company.concrete_plant_silos_count;
    const completenessOk =
      selectedCompleteness === "all" ||
      (selectedCompleteness === "needs_manual" && needsManual) ||
      (selectedCompleteness === "has_plant_name" && Boolean(company.concrete_plant_name)) ||
      (selectedCompleteness === "has_capacity" && Boolean(company.concrete_plant_capacity)) ||
      (selectedCompleteness === "has_silos_count" && Boolean(company.concrete_plant_silos_count));
    const text = (
      `${company.name} ${company.brand} ${company.address} ${company.city} ${company.concrete_plant_name} ` +
      `${company.concrete_plant_mixer} ${company.concrete_plant_capacity} ${company.concrete_plant_silos_count}`
    ).toLowerCase();
    const searchOk = !query || text.includes(query);
    return cityOk && activityOk && completenessOk && searchOk;
  });
}

function markerIcon(company) {
  const isReady = company.activity_type === "ready_mix_concrete";
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: isReady ? "#2563eb" : "#b45309",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    scale: 17,
    labelOrigin: new google.maps.Point(0, 0)
  };
}

function clusterRenderer() {
  return {
    render({ count, position }) {
      return new google.maps.Marker({
        position,
        label: {
          text: String(count),
          color: "#16201f",
          fontSize: "14px",
          fontWeight: "800"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: count >= 10 ? "#d6bd2d" : "#7bbf55",
          fillOpacity: 0.84,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: count >= 10 ? 22 : 19,
          labelOrigin: new google.maps.Point(0, 0)
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
      });
    }
  };
}

function createMap() {
  map = new google.maps.Map(mapElement, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapTypeId: "satellite",
    fullscreenControl: false,
    mapTypeControl: true,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    }
  });

  infoWindow = new google.maps.InfoWindow();
  clusterLayer = new markerClusterer.MarkerClusterer({
    map,
    markers: [],
    renderer: clusterRenderer()
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
      if (!map || !marker) return;
      map.setCenter(marker.getPosition());
      map.setZoom(Math.max(map.getZoom(), 10));
      infoWindow.setContent(popupHtml(company));
      infoWindow.open({ anchor: marker, map });
    });
    companyList.appendChild(button);
  }
}

function renderMap() {
  const items = filteredCompanies();
  companyCount.textContent = String(items.length);
  cityCount.textContent = String(uniqueSorted(items.map((item) => item.city)).length);
  renderList(items);

  if (!map || !clusterLayer) {
    return;
  }

  markers.clear();

  clusterLayer.clearMarkers();

  const mapMarkers = [];
  const bounds = new google.maps.LatLngBounds();

  for (const company of items) {
    if (!Number.isFinite(company.latitude) || !Number.isFinite(company.longitude)) continue;

    const marker = new google.maps.Marker({
      position: { lat: company.latitude, lng: company.longitude },
      title: company.brand || company.name,
      label: {
        text: company.activity_type === "ready_mix_concrete" ? "B" : "G",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "800"
      },
      icon: markerIcon(company)
    });

    marker.addListener("click", () => {
      infoWindow.setContent(popupHtml(company));
      infoWindow.open({ anchor: marker, map });
    });

    markers.set(company.company_id, marker);
    mapMarkers.push(marker);
    bounds.extend(marker.getPosition());
  }

  clusterLayer.addMarkers(mapMarkers);

  if (map && mapMarkers.length > 0) {
    map.fitBounds(bounds, 32);
    google.maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > 11) map.setZoom(11);
    });
  }

}

async function loadData() {
  const response = await fetch("data/companies.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Nepavyko įkelti duomenų: ${response.status}`);
  const payload = await response.json();
  companies = payload.companies || [];
}

async function init() {
  await loadData();
  populateFilters();

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    renderMap();
    showMapNotice("Į public/config.js reikia įrašyti Google Maps JavaScript API raktą.");
    return;
  }

  await loadGoogleMaps(apiKey);
  createMap();
  renderMap();
}

cityFilter.addEventListener("change", renderMap);
activityFilter.addEventListener("change", renderMap);
completenessFilter.addEventListener("change", renderMap);
searchInput.addEventListener("input", renderMap);

init().catch((error) => {
  companyList.innerHTML = `<div class="company-item"><strong>Klaida</strong><span>${escapeHtml(error.message)}</span></div>`;
  showMapNotice(error.message);
});
