# Projekto planas

## Tikslas

Sukurti konkurentų stebėjimo sistemą UAB Betono centras poreikiams:

- rinkti informaciją apie betono mišinių, betono mazgų, gelžbetonio ir surenkamo gelžbetonio gamintojus;
- palaikyti Excel failą kaip greitą MVP duomenų šaltinį;
- iš Excel / seed duomenų generuoti JSON žemėlapiui;
- rodyti Lietuvos įmones interaktyviame žemėlapyje;
- vėliau prijungti daugiau atvirų duomenų šaltinių ir automatinių atnaujinimų.

## Dabartinė kryptis

Pirma veikianti versija išplečiama nuo Vilniaus ir Klaipėdos iki visos Lietuvos. Duomenys renkami iš nemokamų ir viešų šaltinių, pirmiausia iš pačių įmonių viešų svetainių ir kontaktų puslapių.

Rekvizitai.lt masinis kopijavimas nenaudojamas, nes tai gali pažeisti jų naudojimo taisykles. Jei vėliau reikės platesnių laukų, Rekvizitai.lt galima prijungti tik per oficialų mokamą XLS/API kelią.

## Įtraukiamos veiklos

- Betono mišiniai.
- Betono mazgai.
- Gelžbetonis.
- Surenkamas gelžbetonis.
- Ready-mix concrete.
- Precast concrete.

Trinkelės neįtraukiamos, jei tai pagrindinė įmonės veikla.

## Duomenų laukai

Pagrindiniai laukai:

- Įmonės pavadinimas.
- Prekės ženklas.
- Rinkos vaidmuo.
- Miestas.
- Savivaldybė.
- Adresas.
- Koordinatės.
- Veiklos tipas.
- Betono mazgo / gamyklos pavadinimas.
- Betono mazgo našumas.
- Viešas betono mazgo / gamyklos aprašymas.
- Įmonės apyvarta.
- Apyvartos metai.
- Darbuotojų skaičius.
- Automobilių / transporto priemonių skaičius.
- Pagrindinis šaltinis.
- Laukų šaltiniai, jei jie žinomi.
- Pastaba / rankinis papildymas.

## Techninis sprendimas

- `scripts/seed_companies.json` laiko pradinį viešų šaltinių sąrašą.
- `scripts/fetch_open_data.py` tikrina seed duomenų ribas ir šaltinius.
- `scripts/build_mvp.py` generuoja Excel ir JSON.
- `data/companies.xlsx` yra Excel peržiūros ir rankinio papildymo failas.
- `public/data/companies.json` maitina žemėlapį.
- `public/` yra statinė svetainė, tinkama Cloudflare Pages.
- `.github/workflows/weekly-update.yml` yra savaitinio atnaujinimo ruošinys.

## Artimiausi etapai

1. Prijungti Registrų centro atvirus juridinių asmenų duomenis.
2. Prijungti finansinių ataskaitų atvirus duomenis, kur įmanoma automatiškai susieti įmonės kodą.
3. Prijungti „Sodros“ viešus draudėjų duomenis darbuotojų skaičiui.
4. Pridėti patikimesnį geokodavimą naujiems adresams.
5. Atskiriant registracijos adresą nuo faktinės gamybos vietos, papildyti faktinius betono mazgus.
