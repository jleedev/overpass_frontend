import { MapboxLayer } from "@deck.gl/mapbox";
import { Deck } from "@deck.gl/core";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import osmtogeojson from "osmtogeojson";
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
};

const INITIAL_VIEW_STATE = {
  latitude: 40.44,
  longitude: -80,
  zoom: 9,
  bearing: 0,
  pitch: 0,
};

function load_basemap(el) {
  const map = new maplibregl.Map({
    container: el,
    style: MAP_STYLE,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    bearing: INITIAL_VIEW_STATE.bearing,
    pitch: INITIAL_VIEW_STATE.pitch,
  });
  return map;
}

async function load_data() {
  const f = await fetch("osm_data.json");
  const j = await f.json();
  const geojson = osmtogeojson(j);
  return geojson;
}

async function get_data_layer() {
  const data = await load_data();
  return new MapboxLayer({
    id: "deckgl-geojson",
    type: GeoJsonLayer,
    data,
    pickable: true,
    autoHighlight: true,
    getLineWidth: 1,
    lineWidthMinPixels: 5,
    getLineColor: [255, 0, 255],
  });
}

const scatter_layer = new MapboxLayer({
  id: "scatter-layer",
  type: ScatterplotLayer,
  data: [{ position: [-80, 40.44], color: [255, 0, 0], radius: 100 }],
  getColor: (d) => d.color,
  getRadius: (d) => d.radius,
});

async function init() {
  const el = document.getElementById("map");
  const map = await load_basemap(el);
  map.addLayer(await get_data_layer());
  map.addLayer(scatter_layer);
  window.map = map;
}

document.addEventListener("DOMContentLoaded", init);
