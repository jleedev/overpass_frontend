import "dotenv/config";

import fs from "fs/promises";
import esbuild from "esbuild";

await fs.mkdir("dist/", { recursive: true });

const build = (args) => esbuild.build({
  bundle: true,
  format: "esm",
  logLevel: "debug",
  minify: true,
  outdir: "dist/",
  sourcemap: true,
  ...args,
});

await Promise.all([
  build({
    entryPoints: ["src/main.js"],
    define: {
      MAPTILER_KEY: JSON.stringify(process.env.MAPTILER_KEY),
    },
  }),
  build({
    entryPoints: ["src/overpass_worker.js"],
  }),
  fs.copyFile("index.html", "dist/index.html"),
]).catch(() => process.exit(1));
