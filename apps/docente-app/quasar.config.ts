import { defineConfig } from '#q-app/wrappers';

export default defineConfig((ctx) => {
  return {
    boot: ['pinia', 'axios', 'router-guard', 'notify-defaults'],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      typescript: {
        strict: true,
        vueShim: true,
        extendTsConfig(tsConfig) {
          return {};
        },
      },
      vitePlugins: [],
    },
    devServer: {
      open: true,
      port: 9000,
    },
    framework: {
      config: {
        brand: {
          primary: '#1976D2',
          secondary: '#26A69A',
          accent: '#FF7043',
          positive: '#66BB6A',
          negative: '#EF5350',
          info: '#2196F3',
          warning: '#FFA726',
        },
        notify: {
          position: 'bottom',
          timeout: 1800,
          progress: false,
          closeBtn: true,
          actions: [],
        },
      },
      plugins: ['Notify', 'Dialog', 'Loading', 'LocalStorage', 'SessionStorage'],
    },
    animations: [],
    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: ['render'],
    },
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: true,
      manifest: {
        name: 'Aula Docente',
        short_name: 'Aula Docente',
        description: 'Gestión de cursos, asistencia y firmas',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1976D2',
        start_url: '.',
        scope: '/',
        icons: [
          {
            src: 'icons/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    },
    capacitor: {
      hideSplashscreen: true,
    },
    htmlVariables: {
      title: 'Aula Docente',
    },
  };
});
