import { packager } from '@electron/packager';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const stage = resolve('.desktop-stage');
await rm(stage,{recursive:true,force:true});
await mkdir(stage,{recursive:true});
await cp('dist',`${stage}/dist`,{recursive:true});
await cp('dist-desktop',`${stage}/dist-desktop`,{recursive:true});
const {version} = JSON.parse(await readFile('package.json','utf8'));
const {version:electronVersion} = JSON.parse(await readFile('node_modules/electron/package.json','utf8'));
await writeFile(`${stage}/package.json`,JSON.stringify({name:'grandma3-cue-remote',productName:'MA3 Cue Remote',version,type:'module',main:'dist-desktop/apps/desktop/src/main.js'}));
try {
  const paths = await packager({dir:stage,name:'MA3 Cue Remote',platform:'darwin',arch:'arm64',electronVersion,out:'release',overwrite:true,asar:true,appBundleId:'de.wiwaltill.ma3-cue-remote',appCategoryType:'public.app-category.utilities',download:{cacheRoot:resolve('.electron-cache')}});
  for (const output of paths) {
    const app = join(output,'MA3 Cue Remote.app');
    execFileSync('codesign',['--force','--deep','--sign','-',app],{stdio:'inherit'});
    execFileSync('codesign',['--verify','--deep',app],{stdio:'inherit'});
  }
  process.stdout.write(`${paths.join('\n')}\n`);
} finally { await rm(stage,{recursive:true,force:true}); }
