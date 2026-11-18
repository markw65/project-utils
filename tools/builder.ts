import { runBuild, startEndPlugin } from "../src/esbuild-utils.ts";

runBuild([
  {
    entryPoints: ["src/main.ts"],
    bundle: true,
    platform: "node",
    outdir: "build",
    outExtension: { ".js": ".mjs" },
    target: "node20",
    format: "esm",
    sourcesContent: false,
    metafile: true,
    logLevel: "silent",
    treeShaking: true,
    packages: "external",
    plugins: [startEndPlugin()],
  },
]);
