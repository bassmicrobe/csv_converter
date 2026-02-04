import js from "@eslint/js";

export default [
  { ignores: [".next/**", "node_modules/**"] },
  {
    files: ["**/*.{js,ts,tsx}"],
    ...js.configs.recommended,
  },
];
