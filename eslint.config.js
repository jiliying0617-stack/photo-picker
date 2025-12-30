import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^(_|[A-Z])',     // 忽略: 1) 下划线开头的变量, 2) 大写字母开头的常量/组件
        argsIgnorePattern: '^_',             // 忽略下划线开头的函数参数
        caughtErrorsIgnorePattern: '^_',    // 忽略下划线开头的catch错误参数
      }],
    },
  },
  // Browser Extension 专用配置 - 添加 Chrome Extension API 全局变量
  {
    files: ['browser-extension/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',  // Chrome Extension API
      },
    },
  },
])
