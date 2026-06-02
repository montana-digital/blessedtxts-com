import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGE_SOURCE = path.join(ROOT, 'assets', 'source', 'jesus.png');
const PUBLIC = path.join(ROOT, 'public');

async function main() {
  if (!fs.existsSync(IMAGE_SOURCE)) {
    console.log('⚠️  No assets/source/jesus.png — skip image generation');
    return;
  }
  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });

  await sharp(IMAGE_SOURCE)
    .resize(360, null, { withoutEnlargement: true })
    .webp({ quality: 58 })
    .toFile(path.join(PUBLIC, 'logo.webp'));

  await sharp(IMAGE_SOURCE)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'og-image.jpg'));

  await sharp(IMAGE_SOURCE)
    .resize(32, 32, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.png'));

  await sharp(IMAGE_SOURCE)
    .resize(32, 32, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.ico'));

  await sharp(IMAGE_SOURCE)
    .resize(180, 180, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(PUBLIC, 'apple-touch-icon.png'));

  const faviconPng = await sharp(IMAGE_SOURCE)
    .resize(32, 32, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const faviconB64 = faviconPng.toString('base64');
  fs.writeFileSync(
    path.join(PUBLIC, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><image href="data:image/png;base64,${faviconB64}" width="32" height="32"/></svg>`,
  );

  console.log(
    '✅ Assets generated (logo.webp, og-image.jpg, favicon.png/ico/svg, apple-touch-icon.png)',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
