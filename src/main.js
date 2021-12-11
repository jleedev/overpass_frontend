import maplibregl from "maplibre-gl";

const MAP_STYLE = {
  version: 8,
  sources: {
    "raster-tiles": {
      type: "raster",
      url: "https://api.maptiler.com/maps/toner/tiles.json?key=j20l9qIApPvfmDy7ZuPM",
    },
  },
  layers: [{ id: "simple-tiles", type: "raster", source: "raster-tiles" }],
  center: [-80, 40.44],
  zoom: 9,
};

function load_basemap(container) {
  return new maplibregl.Map({
    container,
    antialias: true,
    style: MAP_STYLE,
  });
}

const overpass_worker = new Worker(new URL('overpass_worker.js', import.meta.url), {name: 'overpass_worker'});

async function load_data(url, signal) {
  url = new URL(url, location).toString();
  console.log("posting message");
  overpass_worker.postMessage({
    value: {
      url,
    },
  });
  const result = await new Promise(resolve => {
    overpass_worker.addEventListener('message', resolve, { once: true, signal });
  });
  const { data } = result;
  console.log("got message from worker", data);
  return data.value;
}

async function add_data_layer(map) {
  const data = await load_data("osm_data3.json");
  map.addSource("osm_data", {
    type: "geojson",
    data,
    promoteId: "id",
  });

  map.addLayer({
    type: "line",
    id: "osm_data",
    source: "osm_data",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#808",
        "#f0f",
      ],
      "line-width": 5,
    },
  });

  let hoveredId = null;

  map.on("mouseenter", "osm_data", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "osm_data", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("mousemove", "osm_data", (e) => {
    if (e.features.length > 0) {
      if (hoveredId !== null) {
        map.setFeatureState(
          { source: "osm_data", id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = e.features[0].id;
      map.setFeatureState(
        { source: "osm_data", id: hoveredId },
        { hover: true }
      );
    }
  });

  map.on("mouseleave", "osm_data", () => {
    if (hoveredId !== null) {
      map.setFeatureState(
        { source: "osm_data", id: hoveredId },
        { hover: false }
      );
    }
    hoveredId = null;
  });
}

async function init() {
  const el = document.getElementById("map");
  const map = await load_basemap(el);
  window.map = map;
  await add_data_layer(map);
}

document.addEventListener("DOMContentLoaded", init);
