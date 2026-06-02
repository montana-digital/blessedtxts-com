function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hidden && el.offsetParent !== null);
}

function isMobileDrawer(): boolean {
  return window.matchMedia('(max-width: 900px)').matches;
}

function setBackgroundInert(inert: boolean): void {
  if (!isMobileDrawer()) return;

  const ids = ['reader-verse-toolbar', 'reader-back-to-top'];
  const readerMain = document.querySelector('.reader-main');

  for (const el of [readerMain, ...ids.map((id) => document.getElementById(id))]) {
    if (!el) continue;
    if (inert) {
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('aria-hidden');
    }
  }
}

export function initReaderDrawer(): void {
  const openBtn = document.getElementById('reader-nav-open');
  const drawer = document.getElementById('reader-sidebar-drawer');
  const backdrop = document.getElementById('reader-drawer-backdrop');
  const closeBtn = document.getElementById('reader-nav-close');
  if (!openBtn || !drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    backdrop?.classList.add('is-open');
    document.body.classList.add('reader-drawer-open');
    openBtn.setAttribute('aria-expanded', 'true');
    setBackgroundInert(true);
    closeBtn?.focus();
  };

  const close = () => {
    drawer.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    document.body.classList.remove('reader-drawer-open');
    openBtn.setAttribute('aria-expanded', 'false');
    setBackgroundInert(false);
    openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      close();
      return;
    }
    if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;

    const focusable = getFocusable(drawer);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !drawer.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !drawer.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  });

  drawer.querySelectorAll('a[href*="/read/"]').forEach((a) => {
    a.addEventListener('click', () => {
      if (isMobileDrawer()) close();
    });
  });
}
