export function onRequest(context) {
  const googleMapsApiKey = context.env.GOOGLE_MAPS_API_KEY || "";

  return Response.json(
    { googleMapsApiKey },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
