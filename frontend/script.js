// --- script.js -----------------------------------------------------
import { getToken, isLogged, login, register, logout } from './auth.js';

// ---------- Selectores ----------
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');
const userNameEl = document.getElementById('userName');

const modalEl    = document.getElementById('authModal');
const modal      = bootstrap.Modal.getOrCreateInstance(modalEl);
const authForm   = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const regFields  = document.querySelectorAll('.regField');
const nameInput  = document.querySelector('input[name="name"]');

const productGrid   = document.getElementById('productGrid');
const addProductFrm = document.getElementById('addProductForm');
const profileLink = document.getElementById('profileLink');
const API = '/api';

// ---------- Estado ----------
let isRegisterForm = false;             // ✅ declara explícitamente

// ---------- Util ----------
const $ = sel => document.querySelector(sel);
const fmtPrice = cents =>
  new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 })
      .format(cents / 100);

// ---------- Vista login / registro (SOLO una función) --------------
function switchAuthView () {
  const reg = isRegisterForm;                         // true = registro
  $('#authTitle').textContent = reg ? 'Regístrate' : 'Iniciar sesión';
  regFields.forEach(f => f.classList.toggle('d-none', !reg));
  nameInput.required = reg;                           // evita error 'invalid form control'
  toggleAuth.textContent = reg
    ? '¿Ya tienes cuenta? Inicia sesión'
    : '¿No tienes cuenta? Regístrate';
}

// ---------- Auth UI helpers ----------------------------------------
function updateAuthUI (name = '') {
  const logged = isLogged();
  const loginBtn    = document.getElementById('loginBtn');
  const logoutBtn   = document.getElementById('logoutBtn');
  const userNameEl  = document.getElementById('userName');
  const profileLink = document.getElementById('profileLink');
  loginBtn?.classList.toggle('d-none', logged);
  logoutBtn?.classList.toggle('d-none', !logged);
  userNameEl?.classList.toggle('d-none', !logged);
  profileLink?.classList.toggle('d-none', !logged);

  if (logged && userNameEl) userNameEl.textContent = `Hola, ${name || '📣'}`;
}

// ---------- Eventos -------------------------------------------------
loginBtn.addEventListener('click', () => {
  isRegisterForm = false;
  switchAuthView();
  modal.show();
  
});

logoutBtn.addEventListener('click', () => {
  logout();
  updateAuthUI();
});

toggleAuth.addEventListener('click', () => {
  isRegisterForm = !isRegisterForm;
  switchAuthView();
});

authForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(authForm);
  try {
    if (isRegisterForm) {
      await register(fd.get('name'), fd.get('email'), fd.get('password'));
      alert('¡Registro exitoso! Ahora inicia sesión.');
      isRegisterForm = false;
      switchAuthView();
    } else {
      const name = await login(fd.get('email'), fd.get('password'));
      updateAuthUI(name);
      modal.hide();
    }
    authForm.reset();
  } catch (err) {
    alert(err.msg || 'Error inesperado');
  }
});

// ---------- Productos ----------------------------------------------

async function fetchProducts () {
  const res = await fetch(`${API}/products`);

  if (!res.ok) {
    // Leemos texto para ver el mensaje JSON o HTML que venga
    const txt = await res.text();
    console.error(`Error ${res.status} en /products:`, txt);
    alert('No se pudieron cargar los productos (error del servidor).');
    return;
  }

  const data = await res.json();
  renderProducts(data);  // tu función existente para mostrarlos
}

// async function fetchProducts () {
//   const r = await fetch(`${API}/products`);
//   const data = await r.json();
//   renderProducts(data);
// }

function renderProducts (list) {
  productGrid.innerHTML = '';
  list.forEach(p => {
    productGrid.insertAdjacentHTML('beforeend', `
      <div class="col">
        <div class="card card-product h-100 shadow-sm">
          <img src="${p.image}" class="card-img-top" alt="${p.title}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.title}</h5>
            <p class="card-text text-success fw-semibold mb-4">${fmtPrice(p.price)}</p>
          </div>
        </div>
      </div>
    `);
  });
}

// ---------- Publicar anuncio ---------------------------------------
addProductFrm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isLogged()) return alert('Necesitas iniciar sesión para publicar');

  const data = Object.fromEntries(new FormData(addProductFrm));
  try {
    const r = await fetch(`${API}/products`, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body   : JSON.stringify(data)
    });
    if (!r.ok) throw await r.json();
    addProductFrm.reset();
    await fetchProducts();
    alert('¡Publicado!');
  } catch (err) {
    alert(err.msg || 'No se pudo publicar');
  }
});

// ---------- Init ----------------------------------------------------
updateAuthUI();
fetchProducts();
