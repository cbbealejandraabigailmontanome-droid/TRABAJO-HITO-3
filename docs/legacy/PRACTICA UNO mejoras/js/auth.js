document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#loginForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    CocoStore.write('session', {
      role: 'cliente',
      name: formData.get('customerName').trim(),
      email: formData.get('email').trim()
    });
    window.location.href = 'menu.html';
  });
});
