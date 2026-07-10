import { writeFileSync } from "node:fs";

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

const config = {
  googleMapsApiKey
};

writeFileSync(
  "public/config.js",
  `window.APP_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  "utf8"
);

if (googleMapsApiKey) {
  console.log("Google Maps API key configured for this build.");
} else {
  console.log("GOOGLE_MAPS_API_KEY is empty; using fallback map mode.");
}
