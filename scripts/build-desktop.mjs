import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await rm('dist-desktop',{recursive:true,force:true});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.desktop.json'],{stdio:'inherit'});
