export function showReaderError(message: string): void {
  const el = document.getElementById('reader-status');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.add('reader-status--error');
  el.classList.remove('reader-status--info');
}

export function showReaderInfo(message: string): void {
  const el = document.getElementById('reader-status');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.add('reader-status--info');
  el.classList.remove('reader-status--error');
}

export function clearReaderStatus(): void {
  const el = document.getElementById('reader-status');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
  el.classList.remove('reader-status--error', 'reader-status--info');
}
