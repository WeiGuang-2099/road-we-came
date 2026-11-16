// Packs dist/ into laishilu.zip, ready to upload to itch.io as an HTML game.
// `npm run zip` builds first. A small zip writer on node:zlib, so no
// dependency is needed.
import {Buffer} from 'node:buffer';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, posix, relative, sep} from 'node:path';
import {crc32, deflateRawSync} from 'node:zlib';

const SOURCE = 'dist';
const TARGET = 'laishilu.zip';
// Every entry is dated 1980-01-01, the earliest DOS date, so the same build
// always zips to the same bytes.
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1;
const UTF8_NAMES = 0x0800;

function* walk(dir) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

const records = [];
const directory = [];
let offset = 0;
for (const path of [...walk(SOURCE)].sort()) {
  const name = Buffer.from(relative(SOURCE, path).split(sep).join(posix.sep));
  const data = readFileSync(path);
  const deflated = deflateRawSync(data, {level: 9});
  // Fonts and images are compressed already; store whatever does not shrink.
  const stored = deflated.length >= data.length;
  const body = stored ? data : deflated;
  const method = stored ? 0 : 8;
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(UTF8_NAMES, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  records.push(local, name, body);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(UTF8_NAMES, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(body.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  directory.push(central, name);

  offset += local.length + name.length + body.length;
}

const count = directory.length / 2;
const listing = Buffer.concat(directory);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(count, 8);
end.writeUInt16LE(count, 10);
end.writeUInt32LE(listing.length, 12);
end.writeUInt32LE(offset, 16);

const zip = Buffer.concat([...records, listing, end]);
writeFileSync(TARGET, zip);
console.log(`${TARGET}: ${count} files, ${Math.round(zip.length / 1024)} KB`);
