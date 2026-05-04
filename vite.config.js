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
    __DEV__: JSON.stringify(true),
  },
  resolve: {
    alias: {
      'react-native-safe-area-context': path.resolve(__dirname, 'src/utils/safe-area-shim.jsx'),
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.jsx', '.js', '.json'],
  },
  server: {
    port: 3000,
  },
});
