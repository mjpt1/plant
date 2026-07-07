import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { deflateSync } from "zlib";

const sizes = [192, 512];
const iconsDir = join(process.cwd(), "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

function createPng(size) {
  const width = size;
  const height = size;
  const data = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = size * 0.42;

      if (dist < radius) {
        const t = dist / radius;
        data[idx] = Math.round(16 + (52 - 16) * (1 - t));
        data[idx + 1] = Math.round(185 + (211 - 185) * (1 - t));
        data[idx + 2] = Math.round(129 + (153 - 129) * (1 - t));
        data[idx + 3] = 255;
      } else if (dist < radius + 2) {
        data[idx] = 6;
        data[idx + 1] = 95;
        data[idx + 2] = 70;
        data[idx + 3] = 255;
      } else {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }

  const png = createMinimalPng(width, height, data);
  return png;
}

function createMinimalPng(width, height, rawData) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    rawData.copy(row, 1, y * width * 4, (y + 1) * width * 4);
    rows.push(row);
  }
  const compressed = deflateSync(Buffer.concat(rows));

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const chunks = [
    createChunk("IHDR", ihdr),
    createChunk("IDAT", compressed),
    createChunk("IEND", Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData) >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return crc ^ 0xffffffff;
}

for (const size of sizes) {
  const png = createPng(size);
  writeFileSync(join(iconsDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
}
