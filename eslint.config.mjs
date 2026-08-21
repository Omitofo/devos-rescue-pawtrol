/**
 * ESLint flat config for Next.js 16.
 *
 * Uses the native flat export from eslint-config-next (no FlatCompat).
 * This avoids the circular-structure error that occurs when wrapping
 * the Next config through @eslint/eslintrc FlatCompat.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/config/eslint
 */

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override / extend default ignores from eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),
]);

export default eslintConfig;
