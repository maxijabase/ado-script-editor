// Builds the unpacked extension into dist/. `--zip` also packs it for the stores, `--watch` rebuilds on change.
import { build, context } from 'esbuild';
import { cpSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';

const watch = process.argv.includes('--watch');
const options = { entryPoints: ['src/content.js'], bundle: true, format: 'iife', minify: !watch, outfile: 'dist/content.js', legalComments: 'none' };

rmSync('dist', { recursive: true, force: true });
for (const [from, to] of [['manifest.json', 'manifest.json'], ['src/popup.html', 'popup.html'], ['src/popup.js', 'popup.js'], ['icons', 'icons'], ['LICENSE', 'LICENSE']]) {
  cpSync(from, `dist/${to}`, { recursive: true });
}

if (watch) {
  await (await context(options)).watch();
  console.log('Watching src/content.js (manifest, popup and icons are copied once; restart to pick up changes there)');
} else {
  await build(options);
  if (process.argv.includes('--zip')) {
    const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'));
    const out = `script-editor-for-azure-devops-${version}.zip`;
    const files = readdirSync('dist', { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => `${e.parentPath}/${e.name}`.replace(/\\/g, '/').replace(/^dist\//, ''));
    writeFileSync(out, zip(files.map((name) => [name, readFileSync(`dist/${name}`)])));
    console.log(`Packed ${out} (${files.length} files)`);
  }
}

// Minimal deflate zip writer (no zip64; fine for an extension package).
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name);
    const body = deflateRawSync(data);
    const meta = Buffer.alloc(16);
    meta.writeUInt32LE(crc32(data), 0);
    meta.writeUInt32LE(body.length, 4);
    meta.writeUInt32LE(data.length, 8);
    meta.writeUInt16LE(nameBuf.length, 12);
    // version 20, no flags, deflate, time/date 0 = 1980-01-01
    const common = Buffer.concat([Buffer.from([20, 0, 0, 0, 8, 0, 0, 0, 0x21, 0]), meta.subarray(0, 14), Buffer.from([0, 0])]);
    const header = Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), common, nameBuf]);
    local.push(header, body);
    const centralHeader = Buffer.alloc(46);
    Buffer.from([0x50, 0x4b, 1, 2, 20, 0]).copy(centralHeader, 0);
    common.copy(centralHeader, 6);
    centralHeader.writeUInt32LE(offset, 42);
    central.push(centralHeader, nameBuf);
    offset += header.length + body.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralBuf, end]);
}
