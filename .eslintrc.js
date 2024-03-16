/*module.exports = {
    root: true,
    env: {
      browser: true,
      amd: true,
      node: true,
      es6: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:prettier/recommended',
      'next',
      'next/core-web-vitals',
    ],
    rules: {
      semi: ['error', 'always'],
      'prettier/prettier': 0,
    },
  };
*/
  module.exports = {
    root: true,
    env: {
      browser: true,
      amd: true,
      node: true,
      es6: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:prettier/recommended',
      'next',
      'next/core-web-vitals',
    ],
    rules: {
      semi: ['error', 'always'],
      'prettier/prettier': 0, // Ignora las reglas de Prettier
      'jsx-a11y/click-events-have-key-events': 0, // Ignora el error relacionado con los eventos de clic
      'jsx-a11y/no-noninteractive-element-interactions': 0, // Ignora el error relacionado con elementos no interactivos
    },
  };
  