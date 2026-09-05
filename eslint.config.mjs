import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "dist/**"]),
  {
    rules: {
      // Existing code leans on `any` at the DB/SDK boundaries; surface it without blocking the build.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Browser-side code must not ship debug logging; warn/error stay available.
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}", "src/app/**/page.tsx"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
]);
