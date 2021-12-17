import osmtogeojson from "osmtogeojson";

self.onmessage = async ({ data }) => {
  try {
    const { txt } = data;
    const body = new URLSearchParams();
    body.set("data", txt);
    performance.mark("start");
    const req = await fetch(`https://overpass-api.de/api/interpreter`, {
      method: "POST",
      body,
    });
    let json_byte_length = req.headers.get("content-length");

    performance.mark("got response");
    self.postMessage({
      type: "progress",
      message: `Reading response…`,
    });

    const osm_data = await req.json();

    performance.mark("got body");
    self.postMessage({
      type: "progress",
      message: `Received ${JSON.stringify(osm_data).length} bytes`,
    });

    self.postMessage({
      type: "progress",
      message: `Converting to GeoJSON…`,
    });
    const geojson = osmtogeojson(osm_data);
    performance.mark("converted to geojson");

    self.postMessage({ type: "success", value: geojson });
  } catch (err) {
    self.postMessage({ type: "failure", reason: err });
  }
};
