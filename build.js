import {} from "dotenv/config";
import esbuild from "esbuild";

performance.mark('build');

try {
  await Promise.all([
    esbuild.build({
      entryPoints: ["src/main.js"],
      define: {
        MAPTILER_KEY: `"${process.env.MAPTILER_KEY}"`,
      },
      outdir: "dist/",
      bundle: true,
      minify: true,
      sourcemap: true,
      format: "esm",
    }),
    esbuild.build({
      entryPoints: ["src/overpass_worker.js"],
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
  ]);
} catch {
  process.exit(1);
}

console.log(performance.measure('build').duration);
