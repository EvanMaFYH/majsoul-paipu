const TerserPlugin = require('terser-webpack-plugin')
const config = require('config')
export default {
  env: {
    config,
  },

  publicRuntimeConfig: {
    ...config,
  },

  server: {
    ...config.get('server'),
  },

  router: {
    base: config.get('baseUrl'),
  },
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: '雀魂工具箱 - 牌谱分析与下载 | 专业麻将数据统计平台',
    titleTemplate: '%s',
    htmlAttrs: {
      lang: 'zh-CN',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content:
          '雀魂工具箱提供专业的牌谱分析和下载服务。支持多局对局分析、批量牌谱统计、Excel报表导出、友人场/段位场/比赛场牌谱下载，帮助玩家提升麻将技术。',
      },
      {
        hid: 'keywords',
        name: 'keywords',
        content:
          '雀魂,牌谱分析,麻将统计,对局分析,牌谱下载,雀魂工具,麻将数据,Excel导出,批量统计,友人场,段位场,比赛场,majsoul',
      },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'renderer', content: 'webkit|ie-comp|ie-stand' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' },
      { name: 'author', content: '雀魂工具箱' },
      { name: 'robots', content: 'index, follow' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/element-variables.scss',
    'font-awesome/css/font-awesome.min.css',
    '@/assets/main.scss',
    '@/assets/transition.scss',
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ['@/plugins/element-ui'],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    '@nuxtjs/style-resources',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    [
      './module/http/module',
      {
        httpBaseUri: config.get('httpBaseUri'),
      },
    ],
  ],

  styleResources: {
    scss: './assets/variable.scss',
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: [/^element-ui/],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              drop_debugger: true,
              pure_funcs: ['console.log'],
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        automaticNameDelimiter: '.',
        name: undefined,
        cacheGroups: {},
      },
    },
    postcss: {
      plugins: {
        'postcss-import': {},
        'postcss-url': {},
        'postcss-preset-env': {},
        cssnano: { preset: 'default' },
      },
      preset: {
        autoprefixer: {},
      },
    },
  },
}
