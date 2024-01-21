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
    title: '雀魂牌谱积分工具',
    htmlAttrs: {
      lang: 'zh-CN',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          '雀魂牌谱积分工具，友人场打完统计积分，根据导入的牌谱按照日期排序导出积分统计excel',
      },
      { name: 'keywords', content: '雀魂,牌谱,积分,工具' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'renderer', content: 'webkit|ie-comp|ie-stand' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' },
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
