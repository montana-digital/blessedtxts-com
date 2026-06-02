export interface TranslationOption {
  id: string;
  routeSlug: string;
  shortLabel: string;
}

export function initTranslationPicker(
  currentVersionId: string,
  versions: TranslationOption[],
): void {
  const select = document.getElementById('reader-translation-select') as HTMLSelectElement | null;
  if (!select) return;

  select.addEventListener('change', () => {
    const slug = select.value;
    const target = versions.find((v) => v.routeSlug === slug);
    if (!target || target.id === currentVersionId) return;

    const hash = window.location.hash || '';
    window.location.href = `/${slug}/read${hash}`;
  });
}
