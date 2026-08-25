/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isCenteredInReadingBand } from '../../src/scripts/reader-scroll';

describe('reader-scroll', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.classList.remove('reader-verse-toolbar-visible');
    vi.stubGlobal('innerHeight', 800);
  });

  it('returns true when element center matches reading band', () => {
    const header = document.createElement('header');
    header.className = 'site-header';
    Object.defineProperty(header, 'getBoundingClientRect', {
      value: () => ({ height: 64, top: 0, bottom: 64 }),
    });
    document.body.appendChild(header);

    const el = document.createElement('li');
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 422, height: 20, bottom: 442 }),
    });
    document.body.appendChild(el);

    expect(isCenteredInReadingBand(el, false)).toBe(true);
  });

  it('returns false when element is far above the band center', () => {
    const header = document.createElement('header');
    header.className = 'site-header';
    Object.defineProperty(header, 'getBoundingClientRect', {
      value: () => ({ height: 64, top: 0, bottom: 64 }),
    });
    document.body.appendChild(header);

    const el = document.createElement('li');
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: -200, height: 20, bottom: -180 }),
    });

    expect(isCenteredInReadingBand(el, false)).toBe(false);
  });
});
