# Konkurentų žemėlapis

Tai techninis projekto katalogas žemėlapiui, Excel duomenims ir automatiniam JSON generavimui.

Visa projekto dokumentacija perkelta į:

```text
C:\Users\AKolobuckis\OneDrive - Concretus\Documents\4. Gamyba\0. Projektai\2026\KonkurentuZemelapis\Dokumentacija
```

## Pagrindiniai techniniai failai

- `data/companies.xlsx` - Excel duomenų failas.
- `public/data/companies.json` - žemėlapio duomenys.
- `public/index.html` - viešas žemėlapio puslapis.
- `scripts/build_mvp.py` - Excel ir JSON generavimas.
- `scripts/fetch_open_data.py` - duomenų ir šaltinių patikra.

## Vietinė patikra

```powershell
python scripts/fetch_open_data.py
python scripts/build_mvp.py
python -m http.server 4173 --directory public
```

Vieša žemėlapio nuoroda:

```text
https://konkurentuzemelapis.pages.dev
```
