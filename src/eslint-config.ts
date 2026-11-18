import js from "@eslint/js";
import { importX } from "eslint-plugin-import-x";
import reactPlugin from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import {
  configs as tseslintConfigs,
  plugin as tseslintPlugin,
} from "typescript-eslint";

export interface EslintConfig {
  /** The directories to lint, e.g., ["src", "apps/my-app"] */
  dirs?: string[];
  /** Whether to enable React rules for this specific project */
  react?: boolean;
}

export function createConfig(
  options: EslintConfig = {},
  ...configs: Array<Parameters<typeof defineConfig>[0]>
) {
  const { dirs = ["."], react = true } = options;

  return defineConfig([
    {
      name: "global-ignores",
      ignores: ["dist/", "build/", "node_modules/", "**/.*"],
    },
    {
      plugins: {
        "import-x": importX,
        "@typescript-eslint": tseslintPlugin,
      },
    },
    {
      name: "core",
      files: dirs.map((dir) => `${dir}/**/*.{js,mjs,cjs,ts,jsx,tsx}`),
      extends: [js.configs.recommended, importX.flatConfigs.recommended],
    },
    {
      name: "core-ts",
      files: dirs.map((dir) => `${dir}/**/*.{ts,jsx,tsx}`),
      extends: [...tseslintConfigs.recommended, importX.flatConfigs.typescript],
    },

    ...(react
      ? [
          {
            name: "react-config",
            files: dirs.map((dir) => `${dir}/**/*.{jsx,tsx}`),
            ...reactPlugin.configs.flat.recommended,
            languageOptions: {
              globals: {
                ...globals.browser,
              },
              parserOptions: {
                ecmaFeatures: {
                  jsx: true,
                },
              },
            },
            settings: {
              react: {
                version: "detect",
              },
            },
            rules: {
              "react/react-in-jsx-scope": "off",
            },
          } as const,
        ]
      : []),

    {
      name: "custom-overrides",
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
          ...globals.node,
        },
      },
      rules: {
        // Recursive / Circular Import Checks
        "import-x/no-cycle": [
          "error",
          { maxDepth: Infinity, ignoreExternal: true },
        ],
        "import-x/no-self-import": "error",

        // General Overrides
        //"no-console": "warn",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-unused-expressions": [
          "error",
          {
            allowShortCircuit: true,
            allowTernary: true,
          },
        ],
        "prefer-const": [
          "error",
          {
            destructuring: "all",
          },
        ],
        "no-control-regex": "error",
        "no-constant-condition": [
          "error",
          {
            checkLoops: false,
          },
        ],
        "no-var": "error",
        eqeqeq: ["error", "always", { null: "ignore" }],
      },
    },
    ...configs,
  ]);
}
