import {} from "dotenv/config";
import fs from "fs/promises";
import esbuild from "esbuild";

await fs.mkdir("dist/", { recursive: true });

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
    logLevel: "info",
  }),
  esbuild.build({
    entryPoints: ["src/overpass_worker.js"],
    outdir: "dist/",
    bundle: true,
    minify: true,
    sourcemap: true,
    logLevel: "info",
  }),
  esbuild.build({
    entryPoints: [
      "node_modules/maplibre-gl/dist/maplibre-gl.css",
      "node_modules/bootstrap/dist/css/bootstrap.min.css",
    ],
    outdir: "dist/",
    logLevel: "info",
  }),
  fs.copyFile("index.html", "dist/index.html"),
]);
