# Konkurentų žemėlapis

Tikslas: automatizuotai rinkti ir atnaujinti informaciją apie Lietuvos įmones, kurios gamina betono mišinius, valdo betono mazgus, gamina gelžbetonį arba surenkamą gelžbetonį, ir rodyti ją interaktyviame žemėlapyje.

## Dabartinė versija

- Apimtis: visa Lietuva.
- Duomenų laikmena: `data/companies.xlsx`.
- Žemėlapio duomenys: `public/data/companies.json`.
- Žemėlapis: statinis Leaflet puslapis aplanke `public/`.
- Automatizavimas: GitHub Actions ruošinys savaitiniam atnaujinimui.
- Mokamos API nenaudojamos.
- Masinis Rekvizitai.lt kopijavimas nenaudojamas.

## Įtraukiamos veiklos

- Betono mišiniai.
- Betono mazgai.
- Gelžbetonis.
- Surenkamas gelžbetonis.
- Ready-mix concrete.
- Precast concrete.

Trinkelės neįtraukiamos, jei tai pagrindinė įmonės veikla.

## Pagrindiniai failai

- [Excel duomenys](data/companies.xlsx)
- [Žemėlapio JSON](public/data/companies.json)
- [Žemėlapio puslapis](public/index.html)
- [Duomenų generavimo skriptas](scripts/build_mvp.py)
- [Šaltinių patikros skriptas](scripts/fetch_open_data.py)
- [Paleidimas per GitHub ir Cloudflare](docs/paleidimas-github-cloudflare.md)

## Vietinis paleidimas

```powershell
python scripts/fetch_open_data.py
python scripts/build_mvp.py
python -m http.server 4173 --directory public
```

Tada atidaryti:

```text
http://localhost:4173
```

## Pastaba dėl duomenų pilnumo

Jei apyvarta, darbuotojų skaičius, transporto priemonių skaičius, betono mazgo našumas arba kitas laukas greitai nerandamas nemokamame viešame šaltinyje, laukas paliekamas tuščias. Excel faile yra pastabų / rankinio papildymo stulpelis.
