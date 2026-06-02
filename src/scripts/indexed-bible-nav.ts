function initIndexedBibleNav(): void {
  const nav = document.querySelector('.indexed-bible-nav');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.indexed-bible-nav__link'));
  const sectionIds = links.map((link) => link.dataset.section).filter(Boolean) as string[];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  if (sections.length === 0) return;

  function setActive(sectionId: string): void {
    links.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('indexed-bible-nav__link--active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function syncFromHash(): void {
    const hash = window.location.hash.replace('#', '');
    if (hash && sectionIds.includes(hash)) setActive(hash);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  sections.forEach((section) => observer.observe(section));

  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
}

initIndexedBibleNav();
