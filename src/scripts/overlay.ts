const overlayEl = document.getElementById('site-overlay');
const docEl = document.documentElement;
const needsPadding = !(window.CSS && CSS.supports('scrollbar-gutter: stable'));

function getScrollbarWidth(): number {
  return Math.max(0, window.innerWidth - docEl.clientWidth);
}

if (overlayEl) {
  document.addEventListener('show-overlay', () => {
    if (needsPadding) {
      docEl.style.setProperty('--sbw', `${getScrollbarWidth()}px`);
    }
    docEl.classList.add('overlay-open');
    overlayEl.classList.remove('is-hidden');
  });

  document.addEventListener('hide-overlay', () => {
    docEl.classList.remove('overlay-open');
    overlayEl.classList.add('is-hidden');
    if (needsPadding) docEl.style.removeProperty('--sbw');
  });

  overlayEl.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('overlay-clicked'));
  });
}
