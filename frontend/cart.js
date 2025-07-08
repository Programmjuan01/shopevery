/***************  CONST ****************/
const API        = '/api';
const CART_KEY   = 'shopevery-cart';
const cartUser   = localStorage.getItem('shopevery-uid') || 'default';
const CART_STORE = `${CART_KEY}-${cartUser}`;
let products     = [];
let cart         = JSON.parse(localStorage.getItem(CART_STORE)) || [];

/***************  ELEMENTOS ****************/
const cont   = document.getElementById('cartContainer');
const totalE = document.getElementById('cartTotal');
const clearB = document.getElementById('clearBtn');
const payB   = document.getElementById('payBtn');

/***************  FETCH + INIT ****************/
init();

async function init() {
  try {
    const res = await fetch(`${API}/products`);
    products = await res.json();

    // Limpia productos inválidos
    cart = cart.filter(id => products.some(p => p.id === id));
    saveCart();
    render();
  } catch (err) {
    cont.innerHTML = '<p class="text-danger">Error cargando productos</p>';
    console.error(err);
  }
}

/***************  EVENTOS ****************/
cont.addEventListener('click', e => {
  if (e.target.classList.contains('remove')){
    const idx = +e.target.dataset.idx;
    cart.splice(idx, 1);
    saveCart();
    render();
  }
});

clearB.addEventListener('click', () => {
  if (!cart.length) return;
  if (confirm('¿Vaciar carrito completo?')) {
    cart = [];
    saveCart();
    render();
  }
});

payB.addEventListener('click', payWithPSE);

/***************  PAGO PSE (solo front) *************/
function payWithPSE(){
  if(!cart.length) return alert('Carrito vacío');

  const total = cart.reduce((s, id) =>
    s + products.find(p => p.id === id).price, 0);

  const handler = ePayco.checkout.configure({
    key : 'PK_test_xxxxxxxxxxxxxxxxxxxxx',  // tu PUBLIC KEY de pruebas
    test: true
  });

  handler.open({
    external      : 'false',
    name          : 'Compra Shopevery',
    description   : 'Pago con PSE',
    currency      : 'cop',
    amount        : total.toFixed(2),
    country       : 'co',
    lang          : 'es',
    invoice       : 'ORD-' + Date.now(),
    response      : 'https://programmjuan01.github.io/shopevery/thanks.html',
    methodsDisable: ['TDC','SP','CASH','DP'] // solo PSE y Nequi
  });
}

/***************  RENDER ****************/
function render(){
  if (!cart.length) {
    cont.innerHTML = '<p>Carrito vacío 😢</p>';
    totalE.textContent = form(0);
    syncIndex(); return;
  }

  const html = cart.map((id, i) => {
    const p = products.find(x => x.id === id);
    return `<article class="card cart-item">
              <button class="remove" data-idx="${i}">×</button>
              <img src="${p.image}" alt="${p.title}">
              <div>
                <h3>${p.title}</h3>
                <p class="price">${form(p.price)}</p>
              </div>
            </article>`;
  }).join('');

  cont.innerHTML = html;
  const total = cart.reduce((s, id) => s + products.find(p => p.id === id).price, 0);
  totalE.textContent = form(total);
  syncIndex();
}

/*************** HELPERS ****************/
function form(n) {
  return n.toLocaleString('es-CO', {style:'currency', currency:'COP'});
}

function saveCart() {
  localStorage.setItem(CART_STORE, JSON.stringify(cart));
}

function syncIndex() {
  const span = parent.document?.getElementById('cartCount');
  if(span) span.textContent = cart.length;
}
