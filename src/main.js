import { Deck } from '@deck.gl/core';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import osmtogeojson from 'osmtogeojson';
import maplibregl from 'maplibre-gl';

const MAP_STYLE = {"version":8,"sources":{"raster-tiles":{"type":"raster","url":"https://api.maptiler.com/maps/toner/tiles.json?key=j20l9qIApPvfmDy7ZuPM"}},"layers":[{"id":"simple-tiles","type":"raster","source":"raster-tiles"}]};

const INITIAL_VIEW_STATE = {
  latitude: 40.44,
  longitude: -80,
  zoom: 9,
  bearing: 0,
  pitch: 0
};

function load_basemap(el) {
  const map = new maplibregl.Map({
    container: el,
    style: MAP_STYLE,
    // Note: deck.gl will be in charge of interaction and event handling
    interactive: false,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    bearing: INITIAL_VIEW_STATE.bearing,
    pitch: INITIAL_VIEW_STATE.pitch
  });
  return map;
}

async function build_deck(el) {
  const map = await load_basemap(el);
  const deck = new Deck({
    initialViewState: INITIAL_VIEW_STATE,
    canvas: 'deck-canvas',
    controller: true,
    onViewStateChange: ({viewState}) => {
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      });
    },
    layers: [
      scatter_layer,
    ],
  });
  return { map, deck };
}

async function load_data() {
  const f = await fetch('osm_data.json');
  const j = await f.json();
  const geojson = osmtogeojson(j);
  return geojson;
}

async function get_data_layer() {
  const data = await load_data();
  return new GeoJsonLayer({
    data,
    getLineWidth: 1,
    lineWidthMinPixels: 1,
    getLineColor: [255, 0, 255],
  });
}

const scatter_layer = new ScatterplotLayer({
  data: [{ position: [-80, 40.44], color: [255, 0, 0], radius: 100 }],
  getColor: d => d.color,
  getRadius: d => d.radius
});

async function init() {
  const data_layer = await get_data_layer();
  const el = document.querySelector('#map');
  const { map, deck } = await build_deck(el);
  deck.setProps(
    {
      layers: [
        ...deck.props.layers,
        data_layer,
      ]
    }
  );
  window.map = map;
  window.deck = deck;
}

document.addEventListener('DOMContentLoaded', init);

