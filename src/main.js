import * as L from 'leaflet';
import { LeafletLayer } from 'deck.gl-leaflet';
import { MapView } from '@deck.gl/core';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import osmtogeojson from 'osmtogeojson';

async function load_basemap(el) {
  // const r = await fetch('https://api.maptiler.com/maps/toner/tiles.json?key=j20l9qIApPvfmDy7ZuPM');
  const r = await fetch('https://api.maptiler.com/maps/toner/256/tiles.json?key=j20l9qIApPvfmDy7ZuPM');
  const tilejson = await r.json();
  const [urlTemplate] = tilejson.tiles;
  const {
    minzoom: minZoom,
    maxzoom: maxZoom,
    attribution,
    center: inCenter,
  } = tilejson;
  // const tileSize = 512;
  const [lng, lat] = inCenter.slice(0, 2);
  const center = { lat, lng };
  const zoom = inCenter.slice(2);
  const map = L.map(el, { center, zoom });
  L.tileLayer(urlTemplate, { minZoom, maxZoom, attribution }).addTo(map);
  return map;
}

async function build_deck(el) {
  const map = await load_basemap(el);
  const deckLayer = new LeafletLayer({
    views: [
      new MapView({
        repeat: true
      })
    ],
    layers: [
      scatter_layer
    ]
  });
  map.addLayer(deckLayer);
  return { map, deckLayer };
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
  const { map, deckLayer } = await build_deck(mapContainer);
  deckLayer.setProps(
    {
      layers: [
        ...deckLayer.props.layers,
        data_layer,
      ]
    }
  );
  window.map = map;
  window.deckLayer = deckLayer;
}

document.addEventListener('DOMContentLoaded', init);

