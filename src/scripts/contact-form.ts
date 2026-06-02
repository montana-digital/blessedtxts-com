const form = document.getElementById('contact-form') as HTMLFormElement | null;
const statusEl = document.getElementById('contact-status') as HTMLParagraphElement | null;

if (form && statusEl) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    statusEl.textContent = 'Sending is not available yet — we will wire this up soon.';
    statusEl.hidden = false;
  });
}
