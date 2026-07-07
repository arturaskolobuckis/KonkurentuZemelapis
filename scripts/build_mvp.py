from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "scripts" / "seed_companies.json"
DATA_DIR = ROOT / "data"
PUBLIC_DATA_DIR = ROOT / "public" / "data"

HEADERS = [
    ("company_id", "Įrašo ID"),
    ("company_code", "Įmonės kodas"),
    ("name", "Įmonės pavadinimas"),
    ("brand", "Prekės ženklas"),
    ("market_role", "Rinkos vaidmuo"),
    ("city", "Miestas"),
    ("municipality", "Savivaldybė"),
    ("address", "Adresas"),
    ("latitude", "Platuma"),
    ("longitude", "Ilguma"),
    ("coordinate_quality", "Koordinačių tikslumas"),
    ("coordinate_source_name", "Koordinačių šaltinis"),
    ("coordinate_source_url", "Koordinačių šaltinio URL"),
    ("activity_type", "Veiklos tipas"),
    ("activity_label", "Veikla"),
    ("concrete_plant_name", "Mazgas (gamintojas)"),
    ("concrete_plant_mixer", "Maišyklė"),
    ("concrete_plant_capacity", "Našumas (realus)"),
    ("concrete_plant_silos_count", "Silosų skaičius"),
    ("concrete_plant_description", "Viešas betono mazgo / gamyklos aprašymas"),
    ("classification_confidence", "Klasifikavimo pasitikėjimas"),
    ("website", "Interneto svetainė"),
    ("source_url", "Pagrindinis šaltinis"),
    ("plant_source_url", "Betono mazgo / gamyklos šaltinis"),
    ("manual_note", "Pastaba / rankinis papildymas"),
    ("last_updated", "Paskutinio atnaujinimo data"),
]

KEYS = [key for key, _label in HEADERS]
LABELS = [label for _key, label in HEADERS]

TEMPLATE_HEADERS = [
    ("company_id", "Įrašo ID"),
    ("company_code", "Įmonės kodas"),
    ("name", "Įmonės pavadinimas"),
    ("brand", "Prekės ženklas"),
    ("city", "Miestas"),
    ("municipality", "Savivaldybė"),
    ("address", "Adresas"),
    ("latitude", "Platuma"),
    ("longitude", "Ilguma"),
    ("activity_type", "Veiklos tipas"),
    ("activity_label", "Veikla"),
    ("concrete_plant_name", "Mazgas (gamintojas)"),
    ("concrete_plant_mixer", "Maišyklė"),
    ("concrete_plant_capacity", "Našumas (realus)"),
    ("concrete_plant_silos_count", "Silosų skaičius"),
    ("concrete_plant_description", "Viešas aprašymas"),
    ("source_url", "Pagrindinis šaltinis"),
    ("plant_source_url", "Mazgo / gamyklos šaltinis"),
    ("manual_note", "Pastaba"),
]


def load_companies() -> list[dict]:
    with SEED_PATH.open(encoding="utf-8") as file:
        companies = json.load(file)
    for company in companies:
        company.setdefault("concrete_plant_mixer", "")
        company.setdefault("concrete_plant_silos_count", "")
    return companies


def write_json(companies: list[dict]) -> None:
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": {
            "country": "Lietuva",
            "cities": "Visa Lietuva",
            "excluded_keywords": ["trinkelės"],
        },
            "companies": companies,
    }
    (PUBLIC_DATA_DIR / "companies.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def style_header(row) -> None:
    fill = PatternFill("solid", fgColor="1F2937")
    font = Font(color="FFFFFF", bold=True)
    for cell in row:
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(vertical="center")


def auto_width(ws) -> None:
    for column in ws.columns:
        max_len = 0
        letter = column[0].column_letter
        for cell in column:
            value = "" if cell.value is None else str(cell.value)
            max_len = max(max_len, len(value))
        ws.column_dimensions[letter].width = min(max(max_len + 2, 10), 42)


def write_workbook(companies: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    ws = wb.active
    ws.title = "Įmonės"

    ws.append(LABELS)
    for company in companies:
        ws.append([company.get(key) for key in KEYS])

    style_header(ws[1])
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    table = Table(displayName="ImonesTable", ref=ws.dimensions)
    table.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium2",
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False,
    )
    ws.add_table(table)
    thin = Side(style="thin", color="E5E7EB")
    for row in ws.iter_rows():
        for cell in row:
            cell.border = Border(bottom=thin)
            cell.alignment = Alignment(vertical="top", wrap_text=False)

    for row in ws.iter_rows(min_row=2, min_col=9, max_col=10):
        for cell in row:
            cell.number_format = "0.000000"
    for row in ws.iter_rows(min_row=2, min_col=21, max_col=21):
        for cell in row:
            cell.number_format = "0.00"
    for row in ws.iter_rows(min_row=2, min_col=19, max_col=19):
        for cell in row:
            cell.number_format = "0"

    auto_width(ws)

    meta = wb.create_sheet("Metaduomenys")
    metadata_rows = [
        ["Projektas", "Konkurentų žemėlapis"],
        ["Apimtis", "Visa Lietuva"],
        ["Įtraukta", "Betono mišiniai, betono mazgai, gelžbetonis ir surenkamas gelžbetonis"],
        ["Neįtraukta", "Trinkelės, jei tai pagrindinė veikla"],
        ["Duomenų modelis", "Excel yra MVP duomenų failas; JSON generuojamas žemėlapiui"],
        ["Sugeneruota", datetime.now(timezone.utc).isoformat()],
    ]
    for row in metadata_rows:
        meta.append(row)
    for cell in meta["A"]:
        cell.fill = PatternFill("solid", fgColor="0F766E")
        cell.font = Font(color="FFFFFF", bold=True)
    auto_width(meta)

    log = wb.create_sheet("Importo žurnalas")
    log.append(["Paleidimo laikas", "Būsena", "Šaltinis", "Eilučių skaičius", "Pastabos"])
    log.append(
        [
            datetime.now(timezone.utc).isoformat(),
            "gerai",
            "scripts/seed_companies.json",
            len(companies),
            "MVP seed duomenys. Pilnas atvirų duomenų importas prijungiamas kitose iteracijose.",
        ]
    )
    style_header(log[1])
    auto_width(log)

    wb.save(DATA_DIR / "companies.xlsx")


def write_import_template() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    ws = wb.active
    ws.title = "Pildymo šablonas"
    labels = [label for _key, label in TEMPLATE_HEADERS]
    ws.append(labels)
    ws.append(
        [
            "pvz-uab-betonas",
            "123456789",
            "UAB Pavyzdinė įmonė",
            "Pavyzdinis betonas",
            "Vilnius",
            "Vilniaus m. sav.",
            "Gamyklos g. 1, Vilnius",
            54.6872,
            25.2797,
            "ready_mix_concrete",
            "Betono mišiniai",
            "Stetter",
            "2x3,35 m³",
            "100 m³/val.",
            2,
            "Trumpas viešai randamas mazgo arba gamyklos aprašymas.",
            "https://imones-saltinis.lt/",
            "https://mazgo-saltinis.lt/",
            "Pastabos, ką dar reikia patikslinti.",
        ]
    )
    style_header(ws[1])
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    table = Table(displayName="ImportTemplateTable", ref=ws.dimensions)
    table.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium2",
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False,
    )
    ws.add_table(table)
    thin = Side(style="thin", color="E5E7EB")
    for row in ws.iter_rows():
        for cell in row:
            cell.border = Border(bottom=thin)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
    for row in ws.iter_rows(min_row=2, min_col=8, max_col=9):
        for cell in row:
            cell.number_format = "0.000000"
    for row in ws.iter_rows(min_row=2, min_col=15, max_col=15):
        for cell in row:
            cell.number_format = "0"
    auto_width(ws)
    wb.save(DATA_DIR / "import_template.xlsx")


def main() -> None:
    companies = load_companies()
    write_json(companies)
    write_workbook(companies)
    write_import_template()
    print(f"Built data/companies.xlsx, data/import_template.xlsx and public/data/companies.json for {len(companies)} rows.")


if __name__ == "__main__":
    main()
