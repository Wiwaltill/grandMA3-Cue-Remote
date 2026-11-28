import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';

test('production legacy bundles parse without post-ES2017 syntax and have local loaders',async()=>{
  const html=await readFile('dist/index.html','utf8');
  assert.match(html,/nomodule/);assert.match(html,/vite-legacy-entry/);assert.match(html,/polyfills-legacy/);
  const files=(await readdir('dist/assets')).filter(file=>file.includes('-legacy-') && file.endsWith('.js'));
  assert.ok(files.length>=3);
  for(const file of files)parse(await readFile(`dist/assets/${file}`,'utf8'),{ecmaVersion:2017,sourceType:'script'});
});
test('all inline build loaders are covered by the CSP manifest, including desktop',async()=>{
  const hashes=JSON.parse(await readFile('dist/legacy-csp.json','utf8'));
  for(const path of ['dist/index.html','dist/apps/desktop/index.html']){
    const html=await readFile(path,'utf8');let count=0;
    for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
      if(!match[2].trim())continue;
      const hash=createHash('sha256').update(match[2]).digest('base64');
      assert.ok(hashes.includes(hash),`${path}: loader without hash`);count++;
      if(path.includes('/desktop/'))assert.ok(html.includes(`sha256-${hash}`));
    }
    assert.ok(count>0);
  }
});
