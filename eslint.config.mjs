import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";
import oxlint from 'eslint-plugin-oxlint';

const eslintConfig = defineConfig([
  ...pluginQuery.configs["flat/recommended"],
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/no-cycle": 2,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "docker_data/**",
  ]),
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'), // oxlint should be the last one
]);

export default eslintConfig;

