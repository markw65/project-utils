import js from "@eslint/js";
import { importX } from "eslint-plugin-import-x";
import reactPlugin from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
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
  tsprojects?: string[];
}

type SingleConfig = Parameters<typeof defineConfig>[0];
export function createConfig(
  options: EslintConfig = {},
  ...configs: Array<SingleConfig>
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
    js.configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    tseslintConfigs.recommended,
    ...(options.tsprojects
      ? [
          {
            files: dirs.map((dir) => `${dir}/**/*.{ts,tsx,cts,mts}`),
            languageOptions: {
              parserOptions: {
                project: options.tsprojects,
              },
            },
          },
        ]
      : []),
    ...(react
      ? ([
          reactPlugin.configs["recommended-typescript"],
          reactHooks.configs.flat.recommended,
          {
            rules: {
              "@eslint-react/error-boundaries": "off",
              "@eslint-react/exhaustive-deps": "off",
              "@eslint-react/immutability": "off",
              "@eslint-react/purity": "off",
              "@eslint-react/refs": "off",
              "@eslint-react/rules-of-hooks": "off",
              "@eslint-react/set-state-in-effect": "off",
              "@eslint-react/set-state-in-render": "off",
              "@eslint-react/static-components": "off",
              "@eslint-react/use-memo": "off",
            },
          } as const,
        ] satisfies SingleConfig[])
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
        "import-x/default": "off",
        "import-x/no-named-as-default-member": "off",
        "import-x/no-unresolved": "off",

        // General Overrides
        //"no-console": "warn",
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
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "no-constant-binary-expression": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
    {
      files: dirs.map((dir) => `${dir}/**/*.{ts,tsx,cts,mts}`),
      rules: {
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
      },
    },
    ...configs,
  ]);
}
