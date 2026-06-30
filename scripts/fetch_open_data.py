from __future__ import annotations

import json
import socket
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "scripts" / "seed_companies.json"
DATA_DIR = ROOT / "data"
CHECK_PATH = DATA_DIR / "source-check.json"

ALLOWED_CITIES: set[str] = set()
EXCLUDED_WORDS = {"trinkeles", "trinkelės"}
ALLOWED_ACTIVITY_TYPES = {"ready_mix_concrete", "precast_concrete"}


def check_url(url: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "KonkurentuZemelapisMVP/0.1"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return {"url": url, "ok": 200 <= response.status < 400, "status": response.status}
    except Exception as error:  # noqa: BLE001 - status is diagnostic only.
        return {"url": url, "ok": False, "error": str(error)[:180]}


def validate_rows(rows: list[dict]) -> list[dict]:
    issues: list[dict] = []
    seen_ids: set[str] = set()
    for row in rows:
        company_id = row.get("company_id")
        text = " ".join(
            str(row.get(key, ""))
            for key in ("name", "brand", "activity_label", "concrete_plant_description", "manual_note")
        ).lower()
        if company_id in seen_ids:
            issues.append({"company_id": company_id, "issue": "duplicate_company_id"})
        seen_ids.add(company_id)
        if ALLOWED_CITIES and row.get("city") not in ALLOWED_CITIES:
            issues.append({"company_id": company_id, "issue": "outside_mvp_city"})
        if row.get("activity_type") not in ALLOWED_ACTIVITY_TYPES:
            issues.append({"company_id": company_id, "issue": "outside_mvp_activity"})
        if any(word in text for word in EXCLUDED_WORDS):
            issues.append({"company_id": company_id, "issue": "contains_excluded_keyword"})
        if row.get("latitude") is None or row.get("longitude") is None:
            issues.append({"company_id": company_id, "issue": "missing_coordinates"})
        if not row.get("coordinate_quality"):
            issues.append({"company_id": company_id, "issue": "missing_coordinate_quality"})
        if not row.get("coordinate_source_name") or not row.get("coordinate_source_url"):
            issues.append({"company_id": company_id, "issue": "missing_coordinate_source"})
    return issues


def main() -> None:
    socket.setdefaulttimeout(12)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    rows = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    source_urls = sorted({row.get("source_url") for row in rows if row.get("source_url")})
    result = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "rows": len(rows),
        "scope": "Visa Lietuva",
        "issues": validate_rows(rows),
        "sources": [check_url(url) for url in source_urls],
        "note": "MVP source check for seed rows. Full JAR/Sodra importer is the next iteration.",
    }
    CHECK_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    failed_sources = [item for item in result["sources"] if not item["ok"]]
    if result["issues"]:
        raise SystemExit(f"Seed validation found issues: {result['issues']}")
    if failed_sources:
        print(f"Source URL warnings: {failed_sources}")
    print(f"Checked {len(rows)} seed rows and {len(source_urls)} source URLs.")


if __name__ == "__main__":
    main()
