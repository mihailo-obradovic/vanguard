import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
    'vue/html-self-closing': [
      'warn',
      {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always'
        }
      }
    ],
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
    ],
    'vue/multi-word-component-names': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  }
});
