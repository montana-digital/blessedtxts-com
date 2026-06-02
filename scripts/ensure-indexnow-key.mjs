import fs from 'fs';
import path from 'path';
import {
  keyFilePath,
  loadIndexNowConfig,
  PLACEHOLDER_KEY,
  resolveKey,
} from './indexnow-lib.mjs';

const resolved = resolveKey();

if (!resolved.ok) {
  console.warn(`[indexnow] skip key file: ${resolved.reason}`);
  process.exit(0);
}

const { key } = resolved;
const outPath = keyFilePath(key);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, key, 'utf8');
console.log(`[indexnow] wrote public/${key}.txt`);
