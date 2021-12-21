import osmtogeojson from "osmtogeojson";

self.onmessage = async (event) => {
  const it = handleMessage(event)[Symbol.asyncIterator]();
  try {
    while (true) {
      const { done, value } = await it.next();
      if (done) {
        self.postMessage({ type: "success", value });
        break;
      } else {
        self.postMessage({ type: "progress", value });
      }
    }
  } catch (value) {
    self.postMessage({ type: "failure", value });
  }
};

async function* handleMessage({ data }) {
  asdf;
  const { txt } = data;
  const body = new URLSearchParams();
  body.set("data", txt);
  performance.mark("start");
  const req = await fetch(`https://overpass-api.de/api/interpreter`, {
    method: "POST",
    body,
  });

  yield "Reading response…";

  const osm_data = await req.json();

  yield `Received ${JSON.stringify(osm_data).length} bytes`;
  yield "Converting to GeoJSON…";

  const geojson = osmtogeojson(osm_data);

  return geojson;
}

const doOverpassRequest = () => {};

const getRegularGeojson = () => {};

const getCentroidsGeojson = () => {};

const getBbox = () => {};
