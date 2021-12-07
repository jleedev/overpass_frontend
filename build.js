import esbuild from 'esbuild';

console.log(performance.now());

const buildJs = esbuild.build({
  entryPoints: ['src/main.js'],
  outdir: 'dist/',
  bundle: true,
  minify: true,
  sourcemap: true,
});

const buildCss = esbuild.build({
  entryPoints: ['node_modules/maplibre-gl/dist/maplibre-gl.css'],
  outdir: 'dist/',
});

console.log(...await Promise.all([
  buildJs,
  buildCss,
]));

console.log(performance.now());
