/**
 * Bootstrap npm into a local directory using Node.js built-ins
 * Downloads and extracts the npm tarball from registry
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const NODE = process.execPath;
const NPM_VERSION = '10.9.2'; // LTS compatible version
const TARBALL_URL = `https://registry.npmjs.org/npm/-/npm-${NPM_VERSION}.tgz`;
const OUT_DIR = path.join(__dirname, 'npm-bootstrap');
const NPM_DIR = path.join(OUT_DIR, 'npm');

console.log(`📦 Downloading npm ${NPM_VERSION}...`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const tarPath = path.join(OUT_DIR, 'npm.tgz');
const file = fs.createWriteStream(tarPath);

https.get(TARBALL_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error('HTTP Error:', res.statusCode);
    process.exit(1);
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`✅ Downloaded npm tarball (${Math.round(fs.statSync(tarPath).size/1024)}KB)`);

    // Extract using node's built-in tar (Node 18+)
    try {
      // Use node to extract tar.gz
      const tar = require('node:tar') ; // Node 22+ has built-in tar
    } catch {
      // Fallback: use manual extraction
    }

    // Write npm CLI wrapper script
    const npmCli = path.join(NPM_DIR, 'bin', 'npm-cli.js');
    
    // Use execFile to run tar extraction via node zlib + manual untar
    extractTgz(tarPath, OUT_DIR, () => {
      console.log('✅ npm extracted!');
      console.log(`\n🚀 npm path: ${npmCli}`);
      console.log(`Run: node "${npmCli}" install\n`);
      
      // Test it
      try {
        const ver = execFileSync(NODE, [npmCli, '--version'], { cwd: __dirname }).toString().trim();
        console.log(`✅ npm version: ${ver}`);
        fs.writeFileSync(path.join(__dirname, 'npm-path.txt'), npmCli);
        console.log('📁 Path saved to npm-path.txt');
      } catch (e) {
        console.error('npm test failed:', e.message);
      }
    });
  });
}).on('error', (e) => {
  console.error('Download error:', e.message);
  process.exit(1);
});

function extractTgz(tarPath, destDir, cb) {
  const entries = [];
  const input = fs.createReadStream(tarPath).pipe(zlib.createGunzip());
  let buf = Buffer.alloc(0);

  input.on('data', chunk => { buf = Buffer.concat([buf, chunk]); });
  input.on('end', () => {
    let offset = 0;
    while (offset < buf.length - 512) {
      const header = buf.slice(offset, offset + 512);
      const name = header.slice(0, 100).toString().replace(/\0/g, '').trim();
      if (!name) { offset += 512; continue; }

      const sizeStr = header.slice(124, 136).toString().replace(/\0/g, '').trim();
      const size = parseInt(sizeStr, 8) || 0;
      const type = header[156];

      const blocks = Math.ceil(size / 512);
      const dataStart = offset + 512;
      const data = buf.slice(dataStart, dataStart + size);

      // Strip leading "package/" prefix
      const rel = name.replace(/^package\//, '');
      const fullPath = path.join(destDir, 'npm', rel);

      if (type === 48 || type === 0) { // regular file
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, data);
      } else if (type === 53) { // directory
        fs.mkdirSync(fullPath, { recursive: true });
      }

      offset = dataStart + blocks * 512;
    }
    console.log('✅ Extraction complete');
    cb();
  });
  input.on('error', e => console.error('Extract error:', e.message));
}
