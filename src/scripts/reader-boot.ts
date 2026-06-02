import type { ReaderManifest } from '../lib/reader-types';
import { initReader } from './reader-init';
import { initSkipLink } from './reader-skip-link';
import { initBackToTop } from './reader-back-to-top';
import { showReaderError } from '../lib/reader-status';

export function bootReader(): void {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  initSkipLink();
  initBackToTop();

  const dataEl = document.getElementById('reader-manifest-data');
  const labelEl = document.querySelector('.reader-main h1');
  if (!dataEl?.textContent) {
    showReaderError('Reader configuration missing. Refresh the page.');
    return;
  }

  let manifest: ReaderManifest;
  try {
    manifest = JSON.parse(dataEl.textContent) as ReaderManifest;
  } catch {
    showReaderError('Reader configuration is invalid. Refresh the page.');
    return;
  }

  const translationLabel = labelEl?.textContent?.trim() || 'Bible';
  initReader(manifest, translationLabel).catch((err) => {
    showReaderError(err instanceof Error ? err.message : 'Reader failed to start.');
    console.error(err);
  });
}
