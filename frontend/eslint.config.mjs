import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow `any` — many third-party types (Next.js internals, Lucide, etc.) don't have strict types
      "@typescript-eslint/no-explicit-any": "off",

      // Allow `this` aliasing in callback contexts (common in React/Next patterns)
      "@typescript-eslint/no-this-alias": "off",

      // Allow require() in public/vendor JS files
      "@typescript-eslint/no-require-imports": "off",

      // Allow comments inside JSX children (common in complex layouts)
      "react/jsx-no-comment-textnodes": "off",

      // Allow setState in effects (used for initial data loading)
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore bundled/vendor JS
    "public/cli.js",
  ]),
]);

export default eslintConfig;
