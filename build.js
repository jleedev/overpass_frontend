import esbuild from "esbuild";

console.log(performance.now());

console.log(
  ...(await Promise.all([
    esbuild.build({
      entryPoints: [
        "src/main.js",
        "node_modules/bootstrap/dist/js/bootstrap.bundle.js",
      ],
      outdir: "dist/",
      bundle: true,
      minify: true,
      sourcemap: true,
    }),
    esbuild.build({
      entryPoints: [
        "node_modules/maplibre-gl/dist/maplibre-gl.css",
        "node_modules/bootstrap/dist/css/bootstrap.min.css",
      ],
      outdir: "dist/",
    }),
  ]))
);

console.log(performance.now());
