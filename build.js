import "dotenv/config";

import fs from "fs/promises";
import esbuild from "esbuild";

await fs.mkdir("dist/", { recursive: true });

const build = (args) =>
  esbuild
    .build({
      bundle: true,
      format: "esm",
      logLevel: "debug",
      minify: true,
      outdir: "dist/",
      sourcemap: true,
      ...args,
    })
    .catch(() => process.exit(1));

await Promise.all([
  build({
    entryPoints: ["src/main.js", "src/overpass_worker.js"],
  }),
  fs.copyFile("index.html", "dist/index.html"),
]);
