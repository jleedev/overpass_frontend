import osmtogeojson from "osmtogeojson";

self.onmessage = async ({ data }) => {
  const { txt } = data;
  const body = new URLSearchParams();
  body.set('data', txt);
  const req = await fetch(`https://overpass-api.de/api/interpreter`, { method: 'POST', body });
  const osm_data = await req.json();
  const geojson = osmtogeojson(osm_data);
  self.postMessage({ value: geojson, });
}
