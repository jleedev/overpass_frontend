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

const OSM_TILES = {
  type: "raster",
  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
  tileSize: 256,
};

const STAMEN_TONER = {
  type: "raster",
  tiles: [
    "https://stamen-tiles-a.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
    "https://stamen-tiles-b.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
    "https://stamen-tiles-c.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
    "https://stamen-tiles-d.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
  ],
  tileSize: 256,
};

const MAPTILER_TONER = {
  type: "raster",
  url: `https://api.maptiler.com/maps/toner/tiles.json?key=${MAPTILER_KEY}`,
};

const MAP_STYLE = {
  version: 8,
  sources: {
    "raster-tiles": STAMEN_TONER,
  },
  layers: [{ id: "simple-tiles", type: "raster", source: "raster-tiles" }],
  center: [-80, 40.44],
  zoom: 9,
};

class HelloWorldControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl";
    this._container.innerHTML = `
      <div class="btn-group" role="group" aria-label="Basic example">
        <button type="button" class="btn btn-light">Foo</button>
        <button type="button" class="btn btn-light">Bar</button>
        <button type="button" class="btn btn-light">Baz</button>
      </div>
    `;
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

function load_basemap(container) {
  const map = new maplibregl.Map({
    container,
    antialias: true,
    style: MAP_STYLE,
    maxBounds: [-180, -85.051129, 180, 85.051129],
    renderWorldCopies: false,
  });
  map.addControl(new maplibregl.ScaleControl());
  map.addControl(new HelloWorldControl(), "top-right");
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
    const onMessage = ({ data: { type, value } }) => {
      switch (type) {
        case "success":
          resolve(value);
          overpass_worker.removeEventListener("message", onMessage);
          break;
        case "failure":
          reject(value);
          overpass_worker.removeEventListener("message", onMessage);
          break;
        case "progress":
          const li = document.createElement("li");
          li.textContent = value;
          messagesContainer.append(li);
          break;
        default:
          throw new TypeError(type);
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
    const query = map.queryRenderedFeatures(e.point);
    if (query.length === 0) {
      return;
    }
    const features = new Map(query.map((feat) => [feat.id, feat]));
    const infoText = [...features.values()]
      .map((feat) => [feat.id, feat.properties.name].join(" "))
      .join("\n");

    const infoModalEle = document.getElementById("infoModal");
    infoModalEle.querySelector(".modal-body p").textContent = infoText;
    const infoModal = bootstrap.Modal.getOrCreateInstance(infoModalEle);
    infoModal.show();
  });
}

async function btnRunClick() {
  const progressModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("progressModal")
  );
  try {
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
  } finally {
    progressModal.hide();
  }
}

async function init() {
  const el = document.getElementById("map");
  const map = await load_basemap(el);
  window.map = map;
  document.getElementById("btnRun").addEventListener("click", btnRunClick);
}

document.addEventListener("DOMContentLoaded", init);
