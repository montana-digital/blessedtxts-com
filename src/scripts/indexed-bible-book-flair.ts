function initBookGridFlair(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = Array.from(document.querySelectorAll<HTMLAnchorElement>('.book-grid a'));
  if (items.length === 0) return;

  function scheduleNext(): void {
    const delay = 3000 + Math.random() * 5000;
    window.setTimeout(() => {
      const el = items[Math.floor(Math.random() * items.length)];
      el.classList.add('book-grid-flair');
      el.addEventListener(
        'animationend',
        () => {
          el.classList.remove('book-grid-flair');
        },
        { once: true },
      );
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

initBookGridFlair();
