// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  stylistic: {
    indent: 2, // 4, or 'tab'
    quotes: 'single', // or 'double'
  },
  ignores: [
    '**/types',
    '**/*.svg',
  ],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
    'ts/explicit-function-return-type': 'off',
    'vue/block-order': 'off',
    'vue/valid-template-root': 'off',
  },
  yaml: {
    overrides: {
      'yaml/indent': ['error', 2],
    },
  },
})
