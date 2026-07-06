# Nemokamas MVP

## Tikslas

Per trumpiausią laiką turėti veikiantį konkurentų žemėlapį be mokamų API, be duomenų bazės ir su minimalia infrastruktūra.

## Dabartinis rezultatas

- Excel failas su įmonių sąrašu: `data/companies.xlsx`.
- Automatinis JSON failas žemėlapiui: `public/data/companies.json`.
- Interaktyvus Lietuvos žemėlapis.
- Filtrai pagal miestą, veiklą ir duomenų pilnumą.
- Įmonės kortelė su betono mazgo / gamyklos informacija.
- GitHub Actions ruošinys savaitiniam atnaujinimui.
- Cloudflare Pages talpinimo instrukcija.

## Scope

Dabartinė versija apima visą Lietuvą, bet duomenys dar nėra galutinai pilni. Įrašai pildomi iš viešų įmonių svetainių ir kitų nemokamų šaltinių.

## Neįtraukiama

- Trinkelės, jei tai pagrindinė įmonės veikla.
- Mokama Rekvizitai.lt informacija.
- Masinis Rekvizitai.lt kopijavimas.
- Mokamos API.

## Duomenų spragos

Šie laukai gali būti tušti, jei duomenys greitai nerandami viešai ir nemokamai:

- Betono mazgo našumas.
- Įmonės apyvarta.
- Darbuotojų skaičius.
- Automobilių / transporto priemonių skaičius.

Tokie laukai paliekami Excel faile rankiniam papildymui arba vėlesniam automatiniam importui.
