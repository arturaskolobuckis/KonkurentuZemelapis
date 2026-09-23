from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "scripts" / "seed_companies.json"
OUTPUT_PATH = ROOT / "public" / "data" / "drive-zones-15km.geojson"
VALHALLA_URL = "https://valhalla1.openstreetmap.de/isochrone"

TARGETS = [
    {
        "company_id": "betono-centras-vilnius",
        "label": "Naujoji Riovonių g. 11",
        "color": "#0f766e",
    },
    {
        "company_id": "betono-centras-vilnius-metalo",
        "label": "Metalo g. 19B",
        "color": "#2563eb",
    },
    {
        "company_id": "betono-centras-vilnius-zariju",
        "label": "Žarijų g. 6A",
        "color": "#d97706",
    },
]

TEN_KM_TARGETS = [
    {
        "zone_id": f"{target['company_id']}-10km",
        "company_id": target["company_id"],
        "label": target["label"],
        "color": target["color"],
    }
    for target in TARGETS
]

RING_TARGETS = [
    {
        "zone_id": "betono-centras-vilnius-10-20km",
        "company_id": "betono-centras-vilnius",
        "label": "Riovonių 10–20 km keliais",
        "color": "#7c3aed",
        "inner_distance_km": 10,
        "outer_distance_km": 20,
        "inner_zone_id": "betono-centras-vilnius-10km",
    },
    {
        "zone_id": "betono-centras-vilnius-15-30km",
        "company_id": "betono-centras-vilnius",
        "label": "Riovonių 15–30 km keliais",
        "color": "#7c3aed",
        "inner_distance_km": 15,
        "outer_distance_km": 30,
        "inner_zone_id": "betono-centras-vilnius",
    },
]


def fetch_drive_zone(company: dict, target: dict, distance_km: int = 15) -> dict:
    payload = {
        "locations": [{"lat": company["latitude"], "lon": company["longitude"]}],
        "costing": "auto",
        "contours": [{"distance": distance_km, "color": target["color"].lstrip("#")}],
        "polygons": True,
        "denoise": 0.5,
        "generalize": 100,
    }
    request = Request(
        VALHALLA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "KonkurentuZemelapis/1.0",
            "X-Client-Id": "konkurentuzemelapis.pages.dev",
        },
    )
    with urlopen(request, timeout=90) as response:
        result = json.load(response)

    polygon = next(
        (
            feature
            for feature in result.get("features", [])
            if feature.get("geometry", {}).get("type") in {"Polygon", "MultiPolygon"}
        ),
        None,
    )
    if polygon is None:
        raise RuntimeError(f"Valhalla negrąžino zonos taškui {target['company_id']}")

    return {
        "type": "Feature",
        "properties": {
            "zone_id": target.get("zone_id", target["company_id"]),
            "company_id": target["company_id"],
            "label": target["label"],
            "travel_mode": "automobiliu",
            "distance_km": distance_km,
            "color": target["color"],
            "source": "Valhalla / OpenStreetMap",
        },
        "geometry": polygon["geometry"],
    }


def build_drive_band(target: dict, inner_zone: dict, outer_zone: dict) -> dict:
    inner_geometry = inner_zone["geometry"]
    outer_geometry = outer_zone["geometry"]
    if inner_geometry["type"] != "Polygon" or outer_geometry["type"] != "Polygon":
        raise RuntimeError(f"{target['label']} juostai reikalingos Polygon geometrijos")

    inner_ring = list(reversed(inner_geometry["coordinates"][0]))
    return {
        "type": "Feature",
        "properties": {
            "zone_id": target["zone_id"],
            "company_id": target["company_id"],
            "label": target["label"],
            "travel_mode": "automobiliu",
            "distance_km": target["inner_distance_km"],
            "inner_distance_km": target["inner_distance_km"],
            "outer_distance_km": target["outer_distance_km"],
            "color": target["color"],
            "source": "Valhalla / OpenStreetMap",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [*outer_geometry["coordinates"], inner_ring],
        },
    }


def main() -> None:
    companies = {
        company["company_id"]: company
        for company in json.loads(SEED_PATH.read_text(encoding="utf-8"))
    }
    features = []
    for target, distance_km in [
        *[(target, 15) for target in TARGETS],
        *[(target, 10) for target in TEN_KM_TARGETS],
    ]:
        company = companies.get(target["company_id"])
        if company is None:
            raise RuntimeError(f"Nerastas įrašas {target['company_id']}")
        features.append(fetch_drive_zone(company, target, distance_km=distance_km))

    for target in RING_TARGETS:
        riovoniu_company = companies[target["company_id"]]
        riovoniu_inner_zone = next(
            feature
            for feature in features
            if feature["properties"]["zone_id"] == target["inner_zone_id"]
        )
        riovoniu_outer_zone = fetch_drive_zone(
            riovoniu_company,
            target,
            distance_km=target["outer_distance_km"],
        )
        features.append(build_drive_band(target, riovoniu_inner_zone, riovoniu_outer_zone))

    output = {
        "type": "FeatureCollection",
        "name": "Betono centro automobiliu pasiekiamos zonos",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Valhalla routing engine, OpenStreetMap road network",
        "features": features,
    }
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Built {OUTPUT_PATH.relative_to(ROOT)} with {len(features)} zones")


if __name__ == "__main__":
    main()
