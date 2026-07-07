# Duomenų modelis

## Pagrindinė lentelė

Excel lape `Įmonės` saugomi šie laukai:

- Įrašo ID.
- Įmonės kodas.
- Įmonės pavadinimas.
- Prekės ženklas.
- Rinkos vaidmuo.
- Miestas.
- Savivaldybė.
- Adresas.
- Platuma.
- Ilguma.
- Veiklos tipas.
- Veikla.
- Mazgas (gamintojas).
- Maišyklė.
- Našumas (realus).
- Silosų skaičius.
- Viešas betono mazgo / gamyklos aprašymas.
- Klasifikavimo pasitikėjimas.
- Interneto svetainė.
- Pagrindinis šaltinis.
- Betono mazgo / gamyklos šaltinis.
- Pastaba / rankinis papildymas.
- Paskutinio atnaujinimo data.

## Veiklos tipai

- `ready_mix_concrete` - betono mišiniai ir betono mazgai.
- `precast_concrete` - gelžbetonis ir surenkamas gelžbetonis.

## Duomenų pildymo taisyklės

- Jei betono mazgo gamintojas viešai randamas arba žinomas iš patikimo vidinio šaltinio, jis įrašomas.
- Jei gamintojo nepavyksta patikimai rasti, laukas paliekamas tuščias arba pildomas apibendrintu pavadinimu pagal miestą.
- Jei našumas viešai randamas, jis įrašomas, pvz. `150 m³/val.`.
- Jei našumo nepavyksta rasti, laukas paliekamas tuščias.
- Jei silosų skaičius viešai randamas, jis įrašomas skaičiumi.
- Jei silosų skaičiaus nepavyksta rasti, laukas paliekamas tuščias.
- Kiekvienam įrašui turi būti bent vienas pagrindinis šaltinio URL.

## JSON struktūra

`public/data/companies.json` turi:

- `generated_at` - sugeneravimo laikas.
- `scope` - rinkos apimtis.
- `companies` - įmonių / lokacijų sąrašas.

JSON naudoja techninius raktus anglų kalba, kad žemėlapio kodas būtų stabilus. Excel stulpeliai ir naudotojui matomi tekstai yra lietuviški.
