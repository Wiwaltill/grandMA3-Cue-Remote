import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({base:'./',build:{rollupOptions:{input:{web:resolve('index.html'),desktop:resolve('apps/desktop/index.html')}}}});
