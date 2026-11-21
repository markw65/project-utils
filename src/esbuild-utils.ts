import * as esbuild from "esbuild";
import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as readline from "node:readline";

let buildActive = 0;
let tsBuildActive = 0;
function activate(ts: boolean) {
  if (ts) {
    if (tsBuildActive !== 0) {
      console.error(`tsBuildActive expected to be 0 but got ${tsBuildActive}`);
    }
    tsBuildActive = 1;
  } else {
    buildActive++;
  }
  const state = buildActive + tsBuildActive;
  if (state === 1) {
    console.log(`${new Date().toLocaleString()} - Build active (${state})`);
  }
}

function deactivate(ts: boolean) {
  setTimeout(() => {
    if (ts) {
      if (tsBuildActive !== 1) {
        console.error(
          `tsBuildActive expected to be 1 but got ${tsBuildActive}`
        );
      }
      tsBuildActive = 0;
    } else {
      buildActive--;
    }
    const state = buildActive + tsBuildActive;
    if (!state) {
      console.log(`${new Date().toLocaleString()} - Build inactive (${state})`);
    }
  }, 500);
}

function report(diagnostics: esbuild.Message[], kind: "error" | "warning") {
  diagnostics.forEach(
    (diagnostic) =>
      diagnostic.location?.column != null && diagnostic.location.column++
  );

  return esbuild
    .formatMessages(diagnostics, { kind, color: true, terminalWidth: 100 })
    .then((messages) => messages.forEach((error) => console.log(error)));
}

export function startEndPlugin(options?: {
  onEnd?: (
    result: esbuild.BuildResult,
    options: esbuild.BuildOptions
  ) => Promise<void>;
  onStart?: () => Promise<void>;
}): esbuild.Plugin {
  return {
    name: "startEnd",
    setup(build) {
      build.onStart(async () => {
        activate(false);
        console.log(`${new Date().toLocaleString()} - ESBuild start`);
        await options?.onStart?.();
      });
      build.onEnd(async (result) => {
        try {
          await report(result.errors, "error");
          await report(result.warnings, "warning");
        } catch (e) {
          console.log(e);
        }

        await options?.onEnd?.(result, build.initialOptions);

        console.log("");
        console.log(`${new Date().toLocaleString()} - ESBuild end`);
        deactivate(false);
      });
    },
  };
}

function spawnByLine(
  command: string,
  args: string[],
  lineHandler: (line: string) => void,
  options?: child_process.SpawnOptions
) {
  return new Promise<void>((resolve, reject) => {
    const proc = child_process.spawn(command, args, {
      ...(options || {}),
      shell: process.platform === "win32",
    });
    const stdout = proc.stdout;
    const stderr = proc.stderr;
    if (!stdout || !stderr) {
      throw new Error(`Failed to properly start process: ${command}`);
    }
    const rl = readline.createInterface({ input: stdout });
    const rle = readline.createInterface({ input: stderr });
    proc.on("error", reject);
    rl.on("line", lineHandler);
    rle.on("line", lineHandler);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      reject(new Error(`Process ${command} failed with code ${code}`));
    });
  });
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const tscCommand = ["tsc", "--build"];
const logger = (line: string) => {
  // tsc in watch mode does ESC-c to clear the screen
  line = line.replaceAll("\x1bc", "");
  if (
    /Starting compilation in watch mode|File change detected\. Starting incremental compilation/.test(
      line
    )
  ) {
    activate(true);
  }
  console.log(line);
  if (/Found \d+ errors?\. Watching for file changes/.test(line)) {
    deactivate(true);
  }
};

export async function runBuild(
  allConfigs: esbuild.BuildOptions[],
  options?: { releaseBuild?: boolean; watch?: boolean; nots?: boolean }
) {
  const watch = options?.watch ?? process.argv.includes("--watch");
  const releaseBuild =
    options?.releaseBuild ?? process.argv.includes("--releaseBuild");
  const configs = allConfigs.map((config) => ({
    minify: releaseBuild,
    sourcemap: !releaseBuild,
    ...config,
  }));
  if (watch) {
    await Promise.all([
      ...configs.map((config) =>
        esbuild.context(config).then((context) => context.watch())
      ),
      options?.nots ||
        spawnByLine(
          npx,
          tscCommand.concat(["--watch", "--preserveWatchOutput"]),
          logger
        ),
    ]);
  } else {
    options?.nots || activate(true);
    if (releaseBuild) {
      await fs.rm("build", { force: true, recursive: true });
    }
    return Promise.all([
      ...configs.map((config) => esbuild.build(config)),
      options?.nots ||
        spawnByLine(npx, tscCommand, logger)
          .then(() => {
            console.log(`${new Date().toLocaleString()} - tsc end`);
          })
          .catch(() => deactivate(true)),
    ]).catch((e) => console.log(e));
  }
}
