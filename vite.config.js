import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/Asha/',
  plugins: [react()],
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      'react-native-safe-area-context': path.resolve(__dirname, 'src/utils/safe-area-shim.jsx'),
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.jsx', '.js', '.json'],
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.warn'],
      },
    },
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-native-web'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
          'vendor-xlsx': ['xlsx'],
          'screens-heavy': [
            './src/screens/GoshwaraReportScreen',
            './src/screens/MPRReportScreen',
            './src/screens/AdminSetupScreen',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
  },
});
