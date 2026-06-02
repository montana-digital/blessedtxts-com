const footerDateEl = document.getElementById('footer-date');
if (footerDateEl) {
  const now = new Date();
  footerDateEl.textContent = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  footerDateEl.setAttribute('datetime', now.toISOString().slice(0, 10));
}
