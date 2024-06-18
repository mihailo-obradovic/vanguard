import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': [
      'warn',
      {
        singleline: {
          max: 3
        },
        multiline: {
          max: 1
        }
      }
    ]
  }

  // TODO: Check if needed
  // globals: {
  //   process: 'readonly',
  //   require: 'readonly',
  //   module: 'readonly',
  //   route: 'readonly'
  // }
});
