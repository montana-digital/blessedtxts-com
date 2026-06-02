import fs from 'fs';

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

/**
 * Write via temp file + rename. Retries help on OneDrive / AV locked targets (Windows UNKNOWN).
 */
export function writeAtomic(filePath, data, { retries = 6, delayMs = 250 } = {}) {
  const payload = typeof data === 'string' ? data : String(data);
  const dir = filePath.replace(/[/\\][^/\\]+$/, '');
  if (dir) fs.mkdirSync(dir, { recursive: true });

  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    const tmp = `${filePath}.tmp-${process.pid}-${attempt}`;
    try {
      fs.writeFileSync(tmp, payload);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        /* target may be locked; rename can still succeed */
      }
      fs.renameSync(tmp, filePath);
      return;
    } catch (err) {
      lastErr = err;
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      if (attempt < retries - 1) sleepSync(delayMs * (attempt + 1));
    }
  }
  throw lastErr;
}
