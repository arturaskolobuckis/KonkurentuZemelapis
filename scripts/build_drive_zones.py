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


def fetch_drive_zone(company: dict, target: dict) -> dict:
    payload = {
        "locations": [{"lat": company["latitude"], "lon": company["longitude"]}],
        "costing": "auto",
        "contours": [{"distance": 15, "color": target["color"].lstrip("#")}],
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
            "company_id": target["company_id"],
            "label": target["label"],
            "travel_mode": "automobiliu",
            "distance_km": 15,
            "color": target["color"],
            "source": "Valhalla / OpenStreetMap",
        },
        "geometry": polygon["geometry"],
    }


def main() -> None:
    companies = {
        company["company_id"]: company
        for company in json.loads(SEED_PATH.read_text(encoding="utf-8"))
    }
    features = []
    for target in TARGETS:
        company = companies.get(target["company_id"])
        if company is None:
            raise RuntimeError(f"Nerastas įrašas {target['company_id']}")
        features.append(fetch_drive_zone(company, target))

    output = {
        "type": "FeatureCollection",
        "name": "Betono centro 15 km automobiliu pasiekiamos zonos",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Valhalla routing engine, OpenStreetMap road network",
        "features": features,
    }
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Built {OUTPUT_PATH.relative_to(ROOT)} for {len(features)} plants")


if __name__ == "__main__":
    main()
