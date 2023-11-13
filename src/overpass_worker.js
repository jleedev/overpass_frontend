import osmtogeojson from "osmtogeojson";
import * as turf from "./turf";

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
    console.error(value);
    self.postMessage({ type: "failure", value });
  }
};

async function* handleMessage({ data }) {
  const { txt } = data;

  const req = await fetch(`https://overpass-api.de/api/interpreter`, {
    method: "POST",
    body: new URLSearchParams({
      data: txt,
    }),
  });

  yield "Reading response…";

  const osm_data = await req.json();

  yield `Received ${JSON.stringify(osm_data).length} bytes`;
  yield "Converting to GeoJSON…";
  const geojson = osmtogeojson(osm_data);

  yield "Finding centroids…";
  const centroids = replaceGeometryWithPoints(geojson);

  const bbox = turf.bbox(geojson);

  return { geojson, centroids, bbox };
}

const replaceGeometryWithPoints = (geojson) => {
  return turf.featureCollection(
    turf.featureReduce(
      geojson,
      (previousValue, currentFeature) => {
        const { id, properties } = currentFeature;
        const { geometry } = turf.pointOnFeature(currentFeature);
        const feature = turf.feature(geometry, properties, { id });
        previousValue.push(feature);
        return previousValue;
      },
      [],
    ),
  );
};
