const SCROLL_THRESHOLD = 400;

export function initBackToTop(): void {
  const btn = document.getElementById('reader-back-to-top');
  if (!btn) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateVisibility = () => {
    const show = window.scrollY > SCROLL_THRESHOLD;
    btn.hidden = !show;
  };

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}
