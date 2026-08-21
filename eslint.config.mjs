/**
 * ESLint flat config — required after Next.js 16 removed `next lint`.
 *
 * Uses the official eslint-config-next package which already includes
 * React, React Hooks, and Next.js rules. Extend later if the project
 * needs additional plugins (a11y, import ordering, etc.).
 */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
];

export default eslintConfig;
