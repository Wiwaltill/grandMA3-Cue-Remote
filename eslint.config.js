import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({files:['scripts/*.mjs'],languageOptions:{globals:{process:'readonly'}}},{ignores:['dist/**','dist-desktop/**','release/**','.desktop-stage/**','.electron-cache/**','node_modules/**']},js.configs.recommended,...ts.configs.recommended);
