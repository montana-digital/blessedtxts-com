const MODAL_ID = 'reader-loading-modal';
const TITLE_ID = 'reader-loading-title';
const HINT_ID = 'reader-loading-hint';
const PANEL_SELECTOR = '.reader-loading-modal__panel';
const DEFAULT_TITLE = 'Loading Bible verses…';
const DEFAULT_HINT = 'Please wait a moment.';

let isOpen = false;
let focusBeforeModal: HTMLElement | null = null;

function getModal(): HTMLElement | null {
  return document.getElementById(MODAL_ID);
}

function setReaderContentBusy(busy: boolean): void {
  const content = document.getElementById('reader-content');
  if (!content) return;
  if (busy) {
    content.setAttribute('aria-busy', 'true');
  } else {
    content.removeAttribute('aria-busy');
  }
}

function getFocusableInModal(modal: HTMLElement): HTMLElement[] {
  const panel = modal.querySelector<HTMLElement>(PANEL_SELECTOR);
  if (!panel) return [];
  return [panel, modal.querySelector<HTMLElement>(`#${TITLE_ID}`)].filter(
    (el): el is HTMLElement => el !== null,
  );
}

function trapFocus(e: KeyboardEvent): void {
  if (!isOpen || e.key !== 'Tab') return;
  const modal = getModal();
  if (!modal) return;
  const focusable = getFocusableInModal(modal);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function onModalKeydown(e: KeyboardEvent): void {
  trapFocus(e);
}

export function isReaderLoadingModalOpen(): boolean {
  return isOpen;
}

export function showReaderLoadingModal(message?: string, hint?: string): void {
  const modal = getModal();
  if (!modal) return;

  const title = document.getElementById(TITLE_ID);
  const hintEl = document.getElementById(HINT_ID);
  if (title) title.textContent = message ?? DEFAULT_TITLE;
  if (hintEl) hintEl.textContent = hint ?? DEFAULT_HINT;

  if (!isOpen) {
    focusBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.dispatchEvent(new CustomEvent('show-overlay'));
    document.documentElement.classList.add('reader-loading-open');
    document.addEventListener('keydown', onModalKeydown);
    setReaderContentBusy(true);
  }

  isOpen = true;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');

  const panel = modal.querySelector<HTMLElement>(PANEL_SELECTOR);
  (panel ?? title)?.focus();
}

export function hideReaderLoadingModal(): void {
  if (!isOpen) return;

  const modal = getModal();
  isOpen = false;
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  document.documentElement.classList.remove('reader-loading-open');
  document.dispatchEvent(new CustomEvent('hide-overlay'));
  document.removeEventListener('keydown', onModalKeydown);
  setReaderContentBusy(false);

  if (focusBeforeModal && document.contains(focusBeforeModal)) {
    focusBeforeModal.focus();
  }
  focusBeforeModal = null;
}
