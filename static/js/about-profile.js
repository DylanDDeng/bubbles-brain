let noticeTimer;
let activeStatus;
let copyAttempt = 0;

function clearNotice() {
  clearTimeout(noticeTimer);
  if (activeStatus) activeStatus.textContent = '';
  activeStatus = undefined;
}

document.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-copy-account]') : null;
  if (!button) return;
  const status = button.closest('.about-profile')?.querySelector('[data-copy-status]');
  if (!status) return;
  clearNotice();
  const attempt = ++copyAttempt;
  let message;
  try {
    await navigator.clipboard.writeText(button.dataset.copyAccount);
    message = button.dataset.copyMessage;
  } catch {
    message = button.dataset.copyAccount;
  }
  if (attempt !== copyAttempt || !status.isConnected) return;
  activeStatus = status;
  status.textContent = message;
  noticeTimer = setTimeout(clearNotice, 3000);
});

document.addEventListener('astro:before-swap', () => {
  ++copyAttempt;
  clearNotice();
});
