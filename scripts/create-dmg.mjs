import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

if (process.platform !== 'darwin') throw new Error('DMG packaging requires macOS');
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const bundle = resolve('release/MA3 Cue Remote-darwin-arm64');
const app = join(bundle, 'MA3 Cue Remote.app');
execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
const appVersion = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', join(app, 'Contents/Info.plist')], { encoding: 'utf8' }).trim();
if (appVersion !== version) throw new Error('Build the matching app version before creating a DMG');
const stage = await mkdtemp(join(tmpdir(), 'ma3-cue-dmg-'));
const output = resolve(`release/MA3-Cue-Remote-v${version}-macOS-arm64.dmg`);
try {
  execFileSync('ditto', [app, join(stage, 'MA3 Cue Remote.app')], { stdio: 'inherit' });
  await symlink('/Applications', join(stage, 'Programme'));
  const licenses = join(stage, 'Lizenzen');
  await mkdir(licenses);
  await cp('LICENSE', join(licenses, 'LICENSE.txt'));
  await cp(join(bundle, 'LICENSE'), join(licenses, 'Electron-LICENSE.txt'));
  await cp(join(bundle, 'LICENSES.chromium.html'), join(licenses, 'LICENSES.chromium.html'));
  await writeFile(join(stage, 'Installation.txt'), `MA3 Cue Remote v${version}\n\n1. MA3 Cue Remote.app auf Programme ziehen.\n2. Dieses Image im Finder auswerfen.\n3. Die App aus Programme öffnen.\n\nApple Silicon · macOS 13 oder neuer · grandMA3 onPC 2.5.1.1\n\nAd-hoc signiert, noch nicht Apple-notarisiert. Falls macOS den Start\nblockiert, unter Systemeinstellungen → Datenschutz & Sicherheit die\nMeldung prüfen und nur bei vertrauter Herkunft Dennoch öffnen wählen.\nKein Terminal erforderlich.\n\nEinrichtung und Bedienung:\nhttps://github.com/Wiwaltill/grandMA3-Cue-Remote#in-wenigen-schritten-verbunden\n`);
  execFileSync('hdiutil', ['create', '-srcfolder', stage, '-volname', `MA3 Cue Remote ${version}`, '-fs', 'HFS+', '-format', 'UDZO', '-ov', '-o', output], { stdio: 'inherit' });
  execFileSync('hdiutil', ['verify', output], { stdio: 'inherit' });
  const digest = createHash('sha256').update(await readFile(output)).digest('hex');
  await writeFile(`${output}.sha256`, `${digest}  ${basename(output)}\n`);
  process.stdout.write(`${output}\n`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
