import { getToken, isLogged, logout } from './auth.js';

export function initUserBar () {
  const loginBtn   = document.getElementById('loginBtn');
  const logoutBtn  = document.getElementById('logoutBtn');
  const userNameEl = document.getElementById('userName');
  const profileLink = document.getElementById('profileLink');

  if (!loginBtn) return;                        // página sin barra

  if (isLogged()) {
    fetch('/api/users/me', {
      headers:{ Authorization: 'Bearer ' + getToken() }
    })
    .then(r => r.json())
    .then(u => {
      userNameEl.textContent = u.name;
      userNameEl.classList.remove('d-none');
      profileLink.classList.remove('d-none');
      logoutBtn.classList.remove('d-none');
      loginBtn.classList.add('d-none');
    });
  }

  logoutBtn?.addEventListener('click', () => {
    logout();
    location.href = '/';
  });
}
