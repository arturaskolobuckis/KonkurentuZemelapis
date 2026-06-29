# Paleidimas per GitHub ir Cloudflare Pages

## Vietinis paleidimas

1. Patikrinti pradinius viešus šaltinius ir duomenų ribas:

```powershell
python scripts/fetch_open_data.py
```

2. Sugeneruoti Excel ir JSON:

```powershell
python scripts/build_mvp.py
```

3. Paleisti statinį puslapį:

```powershell
python -m http.server 4173 --directory public
```

4. Atidaryti naršyklėje:

```text
http://localhost:4173
```

## GitHub

Repozitorija:

```text
https://github.com/arturaskolobuckis/KonkurentuZemelapis
```

1. Įkelti visus projekto failus.
2. Patikrinti, kad repozitorijoje yra:

```text
data/companies.xlsx
public/index.html
public/app.js
public/styles.css
public/data/companies.json
.github/workflows/weekly-update.yml
```

GitHub Actions savaitinis atnaujinimas veiks pirmadieniais 05:00 UTC ir gali būti paleistas ranka per `workflow_dispatch`.

## Cloudflare Pages

Cloudflare Pages nuoroda:

```text
Bus užpildyta po pirmo deploy.
```

1. Cloudflare Pages pasirinkti `Connect to Git`.
2. Pasirinkti GitHub repozitoriją.
3. Build nustatymai:

```text
Framework preset: None
Build command: python -m pip install openpyxl && python scripts/fetch_open_data.py && python scripts/build_mvp.py
Build output directory: public
Root directory: /
```

4. Po pirmo deploy Cloudflare duos viešą nuorodą.

## Ribojimai

- Duomenys yra greitas MVP sąrašas, ne galutinė pilna duomenų bazė.
- Apyvarta, darbuotojai ir transportas paliekami tušti, jei nėra greitai ir nemokamai pasiekiamo patikimo šaltinio.
- Rekvizitai.lt masinis kopijavimas nenaudojamas.
- Pilnas Registrų centro, „Sodros“ ir kitų atvirų duomenų importas yra kitas etapas.
