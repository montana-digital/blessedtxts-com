export interface ScrollPassageOptions {
  smooth?: boolean;
  /** Reserve space for the fixed verse toolbar (visible or about to show). */
  reserveToolbar?: boolean;
}

const HEADER_FALLBACK_PX = 64;
const TOOLBAR_FALLBACK_MOBILE_PX = 120;
const TOOLBAR_FALLBACK_DESKTOP_PX = 72;
const CENTER_TOLERANCE_PX = 8;

function measureHeaderHeight(): number {
  const header = document.querySelector<HTMLElement>('.site-header');
  const h = header?.getBoundingClientRect().height;
  return h && h > 0 ? h : HEADER_FALLBACK_PX;
}

function measureToolbarHeight(reserve: boolean): number {
  const toolbar = document.getElementById('reader-verse-toolbar');
  const visible =
    reserve ||
    document.body.classList.contains('reader-verse-toolbar-visible') ||
    (toolbar && !toolbar.hidden);

  if (!visible) return 0;

  const h = toolbar?.getBoundingClientRect().height;
  if (h && h > 0) return h;

  return window.matchMedia('(max-width: 900px)').matches
    ? TOOLBAR_FALLBACK_MOBILE_PX
    : TOOLBAR_FALLBACK_DESKTOP_PX;
}

function readingBandCenter(reserveToolbar: boolean): number {
  const headerH = measureHeaderHeight();
  const toolbarH = measureToolbarHeight(reserveToolbar);
  const bandTop = headerH;
  const bandBottom = window.innerHeight - toolbarH;
  return bandTop + (bandBottom - bandTop) / 2;
}

function elementCenter(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

export function isCenteredInReadingBand(el: HTMLElement, reserveToolbar = false): boolean {
  return Math.abs(elementCenter(el) - readingBandCenter(reserveToolbar)) <= CENTER_TOLERANCE_PX;
}

function scrollOnce(el: HTMLElement, smooth: boolean, reserveToolbar: boolean): void {
  const delta = elementCenter(el) - readingBandCenter(reserveToolbar);
  window.scrollTo({
    top: Math.max(0, window.scrollY + delta),
    behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior),
  });
}

/**
 * Vertically centers an element in the readable band between the sticky site header
 * and the fixed verse toolbar.
 */
export function scrollPassageIntoView(el: HTMLElement, opts?: ScrollPassageOptions): void {
  const smooth = opts?.smooth ?? true;
  const reserveToolbar = opts?.reserveToolbar ?? false;

  if (isCenteredInReadingBand(el, reserveToolbar)) return;

  const run = () => {
    if (!isCenteredInReadingBand(el, reserveToolbar)) {
      scrollOnce(el, smooth, reserveToolbar);
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });

  const verifyDelay = smooth ? 700 : 50;
  window.setTimeout(() => {
    if (!isCenteredInReadingBand(el, reserveToolbar)) {
      scrollOnce(el, false, reserveToolbar);
    }
  }, verifyDelay);
}

/** Re-scroll while lazy chapter mounts shift layout above the target verse. */
export function scrollPassageIntoViewUntilStable(
  el: HTMLElement,
  opts?: ScrollPassageOptions & { maxMs?: number },
): () => void {
  const reserveToolbar = opts?.reserveToolbar ?? false;
  const maxMs = opts?.maxMs ?? 4000;
  const smooth = opts?.smooth ?? false;

  const tick = () => scrollPassageIntoView(el, { reserveToolbar, smooth });

  tick();
  const delays = [120, 300, 600, 1200, 2000];
  const timers = delays.map((ms) => window.setTimeout(tick, ms));

  let hydrated = 0;
  const onHydrated = () => {
    if (hydrated++ > 24) return;
    tick();
  };
  document.addEventListener('reader-chapter-hydrated', onHydrated);

  const stopTimer = window.setTimeout(() => {
    document.removeEventListener('reader-chapter-hydrated', onHydrated);
  }, maxMs);

  return () => {
    timers.forEach((id) => clearTimeout(id));
    clearTimeout(stopTimer);
    document.removeEventListener('reader-chapter-hydrated', onHydrated);
  };
}
