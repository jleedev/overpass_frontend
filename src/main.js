import maplibregl from "maplibre-gl";
import * as bootstrap from "bootstrap";
import { html, render } from "lit-html";

import "maplibre-gl/dist/maplibre-gl.css";
import "bootstrap/dist/css/bootstrap.min.css";

function showError(txt) {
  const errorModalEle = document.getElementById("errorModal");
  const errorModal = bootstrap.Modal.getOrCreateInstance(errorModalEle);
  errorModalEle.querySelector(".modal-body p").textContent = txt;
  errorModal.show();
}

window.onerror = (_message, _source, _lineno, _colno, error) => {
  console.error(error);
  showError(error.stack);
};

window.onunhandledrejection = ({ reason }) => {
  console.error(reason);
  showError(reason.stack);
};

const OSM_TILES = {
  type: "raster",
  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
  tileSize: 256,
};

const CARTO_POSITRON = {
  type: "raster",
  tiles: [
    "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-d.global.ssl.fastly.net/light_all/{z}/{x}/{y}{ratio}.png",
  ],
  tileSize: 256,
  attribution:
    '© <a href="http://www.openstreetmap.org/copyright"> OpenStreetMap </a> contributors, © <a href="https://carto.com/about-carto/"> CARTO </a>',
};

const CARTO_DARK_MATTER = {
  type: "raster",
  tiles: [
    "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-b.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{ratio}.png",
    "https://cartodb-basemaps-d.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{ratio}.png",
  ],
  tileSize: 256,
  attribution:
    "Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.",
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

// const darkModeMatcher = matchMedia("(prefers-color-scheme: dark)");

const MAP_STYLE = {
  version: 8,
  sources: {
    "raster-tiles-light": CARTO_POSITRON,
    "raster-tiles-dark": CARTO_DARK_MATTER,
  },
  layers: [
    {
      id: "light-tiles",
      type: "raster",
      source: "raster-tiles-light",
      // layout: { visibility: darkModeMatcher.matches ? "none" : "visible" },
    },
    /*
    {
      id: "dark-tiles",
      type: "raster",
      source: "raster-tiles-dark",
      layout: { visibility: darkModeMatcher.matches ? "visible" : "none" },
    },
    */
  ],
  center: [-80, 40.44],
  zoom: 9,
};

class LayerSelectionControl extends maplibregl.Evented {
  constructor() {
    super();
    this._handleSelectionChange = this._handleSelectionChange.bind(this);
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl";
    this._container.innerHTML = `
      <div class="btn-group" role="group" aria-label="Geometry Mode">
        <input type="radio" class="btn-check" name="geometry-mode" value="points" id="geometry-mode-point" autocomplete="off">
        <label class="btn btn-outline-secondary" for="geometry-mode-point" aria-label="Points" title="Points">✨</label>

        <input type="radio" class="btn-check" name="geometry-mode" value="clusters" id="geometry-mode-cluster" autocomplete="off">
        <label class="btn btn-outline-secondary" for="geometry-mode-cluster" aria-label="Clusters" title="Clusters">🍇</label>

        <input checked type="radio" class="btn-check" name="geometry-mode" value="geometry" id="geometry-mode-full" autocomplete="off">
        <label class="btn btn-outline-secondary" for="geometry-mode-full" aria-label="Geometry" title="Geometry">🌐</label>

        <input type="radio" class="btn-check" name="geometry-mode" value="heat" id="geometry-mode-heat" autocomplete="off">
        <label class="btn btn-outline-secondary" for="geometry-mode-heat" aria-label="Heatmap" title="Heatmap">🔥</label>
      </div>
    `;
    this._container
      .querySelectorAll("input")
      .forEach((x) =>
        x.addEventListener("change", this._handleSelectionChange)
      );
    return this._container;
  }

  _handleSelectionChange(e) {
    if (e.target.value !== this.selection) {
      const oldValue = this.selection;
      const newValue = (this.selection = e.target.value);
      this.fire("change", { oldValue, newValue });
    }
  }

  onRemove() {
    this._container
      .querySelectorAll("input")
      .forEach((x) =>
        x.removeEventListener("change", this._handleSelectionChange)
      );
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

function set_layer_visibility(map, selection) {
  map.setLayoutProperty(
    "osm_data_fill",
    "visibility",
    selection == "geometry" ? "visible" : "none"
  );
  map.setLayoutProperty(
    "osm_data_line",
    "visibility",
    selection == "geometry" ? "visible" : "none"
  );
  map.setLayoutProperty(
    "osm_data_point",
    "visibility",
    selection == "geometry" ? "visible" : "none"
  );
  map.setLayoutProperty(
    "osm_data_centroids",
    "visibility",
    selection == "points" ? "visible" : "none"
  );
  map.setLayoutProperty(
    "osm_data_centroid_clusters",
    "visibility",
    selection == "clusters" ? "visible" : "none"
  );
  map.setLayoutProperty(
    "osm_data_heat",
    "visibility",
    selection == "heat" ? "visible" : "none"
  );
}

function load_basemap(container) {
  const map = new maplibregl.Map({
    container,
    antialias: true,
    style: MAP_STYLE,
    // maxBounds: [-180, -85.051129, 180, 85.051129],
    renderWorldCopies: false,
  });
  map.addControl(new maplibregl.ScaleControl());
  const layer_selection_control = new LayerSelectionControl();
  layer_selection_control.on("change", ({ newValue }) =>
    set_layer_visibility(map, newValue)
  );
  map.addControl(layer_selection_control, "top-right");
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

function build_data_layers(map) {
  map.addSource("osm_data", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "id",
  });

  map.addSource("osm_data_centroids", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "id",
  });

  map.addSource("osm_data_centroid_clusters", {
    type: "geojson",
    cluster: true,
    data: { type: "FeatureCollection", features: [] },
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

  map.addLayer({
    type: "circle",
    id: "osm_data_centroids",
    source: "osm_data_centroids",
    filter: ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]],
    layout: {
      visibility: "none",
    },
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

  map.addLayer({
    type: "circle",
    id: "osm_data_centroid_clusters",
    source: "osm_data_centroid_clusters",
    filter: ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]],
    layout: {
      visibility: "none",
    },
    paint: {
      "circle-color": [
        "case",
        ["boolean", ["get", "cluster"], false],
        "#ff0",
        "#0ff",
      ],
      "circle-radius": ["min", 15, ["*", 5, ["sqrt", ["get", "point_count"]]]],
      "circle-pitch-alignment": "map",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#000",
    },
  });

  map.addLayer({
    type: "heatmap",
    id: "osm_data_heat",
    source: "osm_data",
    layout: {
      visibility: "none",
    },
    paint: {
      "heatmap-opacity": 0.5,
      "heatmap-radius": 5,
    },
  });

  for (const layer of [
    "osm_data_line",
    "osm_data_fill",
    "osm_data_point",
    "osm_data_centroids",
    "osm_data_centroid_clusters",
  ]) {
    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mousemove", layer, handleMouseMove);
    map.on("mouseleave", layer, handleMouseLeave);
  }

  map.on("click", "osm_data_centroid_clusters", async (e) => {
    // Handle cluster expansion zoom
    const query = map.queryRenderedFeatures(e.point, {
      layers: ["osm_data_centroid_clusters"],
      filter: ["==", ["get", "cluster"], true],
    });
    if (query.length === 0) {
      return;
    }
    const clusterId = query[0].properties.cluster_id;
    const zoom = await new Promise((resolve, reject) => {
      map
        .getSource("osm_data_centroid_clusters")
        .getClusterExpansionZoom(clusterId, (err, zoom) =>
          err ? reject(err) : resolve(zoom)
        );
    });
    map.easeTo({
      center: query[0].geometry.coordinates,
      zoom,
    });
  });

  map.on("click", (e) => {
    // Handle feature inspector
    const query = map.queryRenderedFeatures(e.point, {
      filter: ["!=", ["get", "cluster"], true],
    });
    if (query.length === 0) {
      return;
    }
    console.debug("Feature inspector", ...query);
    const features = new Map(query.map((feat) => [feat.id, feat]));
    const showFeature = ({ id, properties }) => {
      const featureUrl = "https://www.openstreetmap.org/" + id;
      return html`
        <li>
          <a target="_blank" href="${featureUrl}">${id} ${properties.name}</a>
        </li>
      `;
    };
    const infoHtml = html`
      <ul>
        ${[...features.values()].map((feat) => showFeature(feat))}
      </ul>
    `;
    const infoModalEle = document.getElementById("infoModal");
    render(infoHtml, infoModalEle.querySelector(".modal-body p"));
    const infoModal = bootstrap.Modal.getOrCreateInstance(infoModalEle);
    infoModal.show();
  });
}

let resultBbox = undefined;

async function btnRunClick() {
  const progressModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("progressModal")
  );
  try {
    progressModal.show();

    const [[xmin, ymin], [xmax, ymax]] = map.getBounds().toArray();
    const bboxArg = [ymin, xmin, ymax, xmax].join(",");
    const src = document.getElementById("txtEditor").value;
    const builtScript = src.replaceAll("{{bbox}}", bboxArg);
    const { geojson, centroids, bbox } = await executeScript(builtScript);
    resultBbox = bbox;
    map.fitBounds(
      [
        [resultBbox[0], resultBbox[1]],
        [resultBbox[2], resultBbox[3]],
      ],
      { linear: false }
    );

    map.getSource("osm_data").setData(geojson);
    map.getSource("osm_data_centroids").setData(centroids);
    map.getSource("osm_data_centroid_clusters").setData(centroids);
  } finally {
    progressModal.hide();
  }
}

async function init() {
  const el = document.getElementById("map");
  const map = load_basemap(el);
  window.map = map;
  await new Promise((resolve) => map.once("load", resolve));
  /*
  darkModeMatcher.addEventListener("change", () => {
    map.setLayoutProperty(
      "light-tiles",
      "visibility",
      darkModeMatcher.matches ? "none" : "visible"
    );
    map.setLayoutProperty(
      "dark-tiles",
      "visibility",
      darkModeMatcher.matches ? "visible" : "none"
    );
  });
  */
  build_data_layers(map);
  document.getElementById("btnRun").addEventListener("click", btnRunClick);
}

document.addEventListener("DOMContentLoaded", init);
