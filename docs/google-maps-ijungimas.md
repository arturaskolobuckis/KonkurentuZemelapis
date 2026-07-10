# Google Maps įjungimas

Svetainė jau paruošta Google Maps pagrindui. Kol raktas tuščias, ji automatiškai naudoja dabartinį nemokamą žemėlapį.

## 1. Google Cloud

1. Sukurkite arba pasirinkite Google Cloud projektą.
2. Įjunkite **Maps JavaScript API**.
3. Sukurkite API raktą.
4. Raktą apribokite pagal HTTP referrer:
   - `https://konkurentuzemelapis.pages.dev/*`
   - `https://*.konkurentuzemelapis.pages.dev/*`
   - jei bus naudojamas atskiras domenas, pridėkite ir jį.

## 2. Cloudflare Pages

Cloudflare Pages projekte `konkurentuzemelapis` pridėkite aplinkos kintamąjį:

```text
GOOGLE_MAPS_API_KEY=čia_įrašomas_google_maps_raktas
```

Po to paleiskite naują deploy. Build metu `scripts/build_config.mjs` sugeneruos `public/config.js`, o svetainė automatiškai persijungs į Google Maps.

## 3. Patikra

Atidarykite:

```text
https://konkurentuzemelapis.pages.dev
```

Jei Google Maps raktas veikia, žemėlapis bus Google Maps palydovinis pagrindas su tais pačiais įmonių žymekliais, grupavimu, filtrais ir sąrašu.
