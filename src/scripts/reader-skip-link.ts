export function initSkipLink(): void {
  const link = document.querySelector<HTMLAnchorElement>('.skip-link[href="#reader-content"]');
  const target = document.getElementById('reader-content');
  if (!link || !target) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  link.addEventListener('click', (e) => {
    e.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}
