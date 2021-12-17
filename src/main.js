import maplibregl from "maplibre-gl";
import * as bootstrap from "bootstrap";
export { bootstrap };

function showError(txt) {
  const errorModalEle = document.getElementById("errorModal");
  const errorModal = bootstrap.Modal.getOrCreateInstance(errorModalEle);
  errorModalEle.querySelector(".modal-body p").textContent = txt;
  errorModal.show();
}

window.onunhandledrejection = ({ reason }) => {
  showError(reason.stack);
};

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
  const map = new maplibregl.Map({
    container,
    antialias: true,
    style: MAP_STYLE,
  });
  map.addControl(new maplibregl.ScaleControl());
  // disable map rotation using right click + drag
  map.dragRotate.disable();
  // disable map rotation using touch rotation gesture
  map.touchZoomRotate.disableRotation();
  return map;
}

const overpass_worker = new Worker(
  new URL("overpass_worker.js", import.meta.url),
  { name: "overpass_worker" }
);

async function executeScript(txt) {
  overpass_worker.postMessage({
    txt,
  });
  const messagesContainer = document.querySelector("#messages");
  messagesContainer.textContent = "";
  const data = await new Promise((resolve, reject) => {
    const onMessage = ({ data }) => {
      switch (data.type) {
        case "success":
          resolve(data.value);
          overpass_worker.removeEventListener("message", onMessage);
          break;
        case "failure":
          reject(data.reason);
          overpass_worker.removeEventListener("message", onMessage);
          break;
        case "progress":
          const li = document.createElement("li");
          li.textContent = data.message;
          messagesContainer.append(li);
          break;
        default:
          throw new TypeError(data.type);
      }
    };
    overpass_worker.addEventListener("message", onMessage);
  });
  return data;
}

let hoveredId = null;

const handleMouseMove = (e) => {
  if (e.features.length > 0) {
    if (hoveredId !== null) {
      map.setFeatureState(
        { source: "osm_data", id: hoveredId },
        { hover: false }
      );
    }
    hoveredId = e.features[0].id;
    map.setFeatureState({ source: "osm_data", id: hoveredId }, { hover: true });
  }
};

const handleMouseLeave = () => {
  if (hoveredId !== null) {
    map.setFeatureState(
      { source: "osm_data", id: hoveredId },
      { hover: false }
    );
  }
  hoveredId = null;
};

function add_data_layer(data) {
  map.addSource("osm_data", {
    type: "geojson",
    data,
    promoteId: "id",
  });

  map.addLayer({
    type: "fill",
    id: "osm_data_fill",
    source: "osm_data",
    filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
    paint: {
      "fill-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "rgba(128,128,0,0.5)",
        "rgba(255,255,0,0.5)",
      ],
      "fill-outline-color": "#f0f",
    },
  });

  map.addLayer({
    type: "line",
    id: "osm_data_line",
    source: "osm_data",
    filter: [
      "in",
      ["geometry-type"],
      ["literal", ["LineString", "MultiLineString"]],
    ],
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

  map.addLayer({
    type: "circle",
    id: "osm_data_point",
    source: "osm_data",
    filter: ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]],
    paint: {
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "#808",
        "#f0f",
      ],
      "circle-radius": 5,
      "circle-pitch-alignment": "map",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#000",
    },
  });

  for (const layer of ["osm_data_line", "osm_data_fill", "osm_data_point"]) {
    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mousemove", layer, handleMouseMove);
    map.on("mouseleave", layer, handleMouseLeave);
  }

  map.on("click", (e) => {
    const features = new Map(
      map.queryRenderedFeatures(e.point).map((feat) => [feat.id, feat])
    );
    console.log(
      ...[...features.values()].map((feat) =>
        [feat.id, feat.properties.name].join(" ")
      )
    );
  });
}

async function btnRunClick() {
  const progressModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("progressModal")
  );
  progressModal.show();

  const [[xmin, ymin], [xmax, ymax]] = map.getBounds().toArray();
  const bbox = [ymin, xmin, ymax, xmax].join(",");
  const src = document.getElementById("txtEditor").value;
  const builtScript = src.replaceAll("{{bbox}}", bbox);
  const data = await executeScript(builtScript);

  if (map.getSource("osm_data")) {
    map.getSource("osm_data").setData(data);
  } else {
    add_data_layer(data);
  }
  progressModal.hide();
}

async function init() {
  const el = document.getElementById("map");
  const map = await load_basemap(el);
  window.map = map;
  document.getElementById("btnRun").addEventListener("click", btnRunClick);
}

document.addEventListener("DOMContentLoaded", init);
