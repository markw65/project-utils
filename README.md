## Various utilities to help configure eslint and esbuild

I found that all of my projects were duplicating most of this code, each with its own bugs and special features, so I decided to make a utility package that could be shared between them.

### Installation

Add this project as a dev dependency:

```
npm install -D @markw65/project-utils
```

### Setting up eslint

Add an `eslint.config.mjs` file to the root directory:

```
import { createConfig } from "@markw65/project-utils";

const config = createConfig(
  {
    // enable or disable jsx/tsx
    react: false,
    // specify the directories to lint
    dirs: ["src", "test"],
  },
  // add project specific rules here
  { rules: { "import-x/no-cycle": "off" } }
);

export default config;
```

### Setting up esbuild

Add an `esbuild.mjs` file to the root directory:

```
import { runBuild, startEndPlugin } from "@markw65/project-utils";

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
```

You can run it as `node esbuild.mjs` to do a debug build (not minified and sourcemaps enabled), `node esbuild.mjs --release` to do a release build (minified and sourcemaps disabled), or `node esbuild --watch` to rebuild on demand. You can also pass an options argument after the build configs to explicitly specify `{ releaseBuild, watch, nots }`. `releaseBuild` and `watch` override the command line arguments, and `nots` turns off the typescript build.

`startEndPlugin()` keeps track of whether the build is active, and spits out `- Build active` and `- Build inactive` messages that you can parse with a vscode problemMatcher. It takes an options argument that can specify onStart and onEnd callbacks if you need to do additional work there.
