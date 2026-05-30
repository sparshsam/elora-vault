import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "contracts/lib/**",
  ]),
  {
    rules: {
      // Allow data fetching in useEffect (React 19 rule is overly strict)
      "react-hooks/set-state-in-effect": "off",
      // Allow useEffect with empty deps for mount-only data fetching
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
