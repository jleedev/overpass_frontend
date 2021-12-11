import osmtogeojson from "osmtogeojson";

console.log('hello from overpass_worker.js');

self.onmessage = async msg => {
  const { data } = msg;
  console.log('got message from script', data);
  const result = await load_data(data.value.url);
  console.log('posting');
  self.postMessage({
    value: result,
  });
  console.log('posted');
}

async function load_data(url) {
  console.debug('load_data for', url);
  const f = await fetch(url);
  console.debug('read json');
  const j = await f.json();
  console.debug('convert to geojson');
  const geojson = osmtogeojson(j);
  console.debug('/load_data');
  return geojson;
}
