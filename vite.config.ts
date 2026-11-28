import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import legacy, { cspHashes } from '@vitejs/plugin-legacy';
export default defineConfig({
  base:'./',
  plugins:[
    legacy({targets:['ios >= 10.3','safari >= 10.1'],additionalLegacyPolyfills:['core-js/modules/es.global-this.js','core-js/modules/web.url-search-params.js','core-js/modules/web.queue-microtask.js']}),
    {name:'legacy-csp',generateBundle(){this.emitFile({type:'asset',fileName:'legacy-csp.json',source:JSON.stringify(cspHashes)});},transformIndexHtml:{order:'post',handler(html){return html.replace("script-src 'self';",`script-src 'self' ${cspHashes.map(hash=>`'sha256-${hash}'`).join(' ')};`);}}},
  ],
  build:{cssTarget:'safari10.1',rollupOptions:{input:{web:resolve('index.html'),desktop:resolve('apps/desktop/index.html')}}},
});
