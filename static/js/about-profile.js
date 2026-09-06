document.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-copy-account]') : null;
  if (!button) return;
  const status = button.closest('.about-profile')?.querySelector('[data-copy-status]');
  if (!status) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copyAccount);
    status.textContent = button.dataset.copyMessage;
  } catch {
    status.textContent = button.dataset.copyAccount;
  }
});
