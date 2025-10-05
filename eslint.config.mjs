import { dirname } from "path";
import { fileURLToPath } from "url";
import pluginQuery from '@tanstack/eslint-plugin-query'
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});


const eslintConfig = [
  ...pluginQuery.configs["flat/recommended"],
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docker_data/**",
    ],
  },
];

export default eslintConfig;
