import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ...react.configs.flat.recommended.languageOptions,
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "better-tailwindcss": betterTailwindcss,
    },
    settings: {
      react: {
        version: "detect",
      },
      "better-tailwindcss": {
        tw4: true,
        entryPoint: "./src/index.css",
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...betterTailwindcss.configs["stylistic-warn"].rules,
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { strictness: "loose" },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // React — JSX in TSX only, no propTypes needed with TS
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      // TypeScript
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-irregular-whitespace": "off",
      // Disable overly strict rules that don't work well with this codebase
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  }
);
