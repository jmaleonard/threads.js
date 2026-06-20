import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"
import globals from "globals"

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "dist-esm/**",
      "bundle/**",
      "docs/**",
      "test-tooling/**/dist/**",
      "test-browser/.dist/**",
      "playwright-report/**",
      "test-results/**",
      "test/workers/*.js"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      // This library deliberately works with dynamic message payloads and
      // generic worker return values, so `any` is used intentionally.
      "@typescript-eslint/no-explicit-any": "off",
      // The worker bootstrapping relies on `require`/`eval` to dodge bundlers
      // and to lazily load `worker_threads`.
      "@typescript-eslint/no-require-imports": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      // The public API exposes companion namespaces (e.g. `Pool`) alongside
      // their factory functions.
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrors: "none" }
      ]
    }
  },
  {
    // Plain CommonJS files (root entry shims, webpack/rollup configs).
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  {
    // ESM browser fixture bundled (not executed) by the rollup tooling test.
    // It imports names that intentionally shadow browser globals (e.g. Worker).
    files: ["test-tooling/rollup/app.js"],
    languageOptions: {
      sourceType: "module"
    },
    rules: {
      "no-redeclare": "off"
    }
  },
  eslintConfigPrettier
)
