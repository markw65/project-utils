import { createConfig } from "./build/main.mjs";

const config = createConfig({
  react: false,
  dirs: ["src", "tools"],
});

export default config;
