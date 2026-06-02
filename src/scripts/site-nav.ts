const mobileMenuButton = document.querySelector('.mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

const OPEN_MENU_LABEL = 'Open main menu';
const CLOSE_MENU_LABEL = 'Close main menu';

if (mobileMenuButton && mobileMenu) {
  const mediaQuery = window.matchMedia('(min-width: 1024px)');

  const setMenuOpen = (open: boolean) => {
    mobileMenu.dataset.state = open ? 'open' : 'closed';
    mobileMenuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenuButton.setAttribute('aria-label', open ? CLOSE_MENU_LABEL : OPEN_MENU_LABEL);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.dispatchEvent(new CustomEvent('hide-overlay'));
  };

  const toggleMenu = () => {
    const currentState = mobileMenu.dataset.state;
    if (currentState === 'closed') {
      setMenuOpen(true);
      document.dispatchEvent(new CustomEvent('show-overlay'));
    } else {
      closeMenu();
    }
  };

  const handleMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) closeMenu();
  };

  mobileMenuButton.addEventListener('click', toggleMenu);
  document.addEventListener('overlay-clicked', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.dataset.state === 'open') closeMenu();
  });
  mediaQuery.addEventListener('change', handleMediaChange);

  mobileMenu.querySelectorAll('a.site-header__link--mobile').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}
