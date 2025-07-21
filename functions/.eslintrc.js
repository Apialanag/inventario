module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // <-- Esta línea es clave, le dice que es un entorno de Node.js
  },
  extends: ["eslint:recommended", "google"],
  parserOptions: {
    ecmaVersion: 2020, // Usamos una versión de JavaScript más moderna
  },
  rules: {
    quotes: ["error", "double"],
  },
};
