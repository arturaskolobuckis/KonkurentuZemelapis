# Automatizavimo eiga

## Savaitinis procesas

1. Paleidžiamas automatinis GitHub Actions darbas.
2. Vykdomas `scripts/fetch_open_data.py`.
3. Patikrinama, ar seed įrašai atitinka projekto ribas: visa Lietuva, betono mišiniai, betono mazgai, gelžbetonis, surenkamas gelžbetonis.
4. Patikrinama, ar nėra trinkelių kaip pagrindinės veiklos.
5. Patikrinami pagrindiniai šaltinių URL.
6. Vykdomas `scripts/build_mvp.py`.
7. Sugeneruojamas `data/companies.xlsx`.
8. Sugeneruojamas `public/data/companies.json`.
9. GitHub Actions įrašo pasikeitusius failus į repozitoriją.
10. Cloudflare Pages automatiškai atnaujina žemėlapį.

## Kokybės patikros

- Įrašo ID turi būti unikalus.
- Įrašas turi turėti koordinates.
- Įrašas turi turėti pagrindinį šaltinio URL.
- Įrašas turi priklausyti leistinai veiklai.
- Trinkelės neturi būti pagrindinis atrankos kriterijus.
- Tušti finansų, darbuotojų, transporto ir našumo laukai nelaikomi klaida, jei nemokamas patikimas šaltinis nerastas.

## Dalinimasis

- Žemėlapis talpinamas per Cloudflare Pages.
- Excel failas laikomas GitHub repozitorijoje.
- Vėliau Excel kopija gali būti automatiškai padedama į SharePoint arba OneDrive.

## Kitas automatizavimo etapas

Kitas žingsnis - pakeisti dalį rankinio seed sąrašo automatiniu importu iš Registrų centro, finansinių ataskaitų ir „Sodros“ viešų duomenų.
