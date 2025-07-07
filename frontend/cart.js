/***************  CONST ****************/
const LS_PRODUCTS = 'shopevery-products';
const CART_KEY    = 'shopevery-cart';

const products = JSON.parse(localStorage.getItem(LS_PRODUCTS)) || [];
let   cart     = JSON.parse(localStorage.getItem(CART_KEY))   || [];

/* limpia IDs que ya no existan */
cart = cart.filter(id => products.some(p => p.id === id));
saveCart();

/***************  ELEMENTOS ****************/
const cont   = document.getElementById('cartContainer');
const totalE = document.getElementById('cartTotal');
const clearB = document.getElementById('clearBtn');
const payB   = document.getElementById('payBtn');

render();

/***************  EVENTOS ****************/
cont.addEventListener('click', e => {
  if (e.target.classList.contains('remove')){
    const idx = +e.target.dataset.idx;
    cart.splice(idx,1);
    saveCart(); render();
  }
});

clearB.addEventListener('click', () => {
  if (!cart.length) return;
  if (confirm('¿Vaciar carrito completo?')){
    cart = []; saveCart(); render();
  }
});

payB.addEventListener('click', payWithPSE);

/*************  PAGO PSE (solo front) *************/
function payWithPSE(){
  if(!cart.length) return alert('Carrito vacío');

  const total = cart.reduce((s,id)=>
                 s + products.find(p=>p.id===id).price, 0);

  const handler = ePayco.checkout.configure({
    key : 'PK_test_xxxxxxxxxxxxxxxxxxxxx',   // tu PUBLIC KEY pruebas
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
    methodsDisable: ['TDC','SP','CASH','DP'] // deja solo PSE (+Nequi)
  });
}

/***************  RENDER ****************/
function render(){
  if(!cart.length){
    cont.innerHTML = '<p>Carrito vacío 😢</p>';
    totalE.textContent = form(0);
    syncIndex(); return;
  }

  const html = cart.map((id,i)=>{
    const p = products.find(x=>x.id===id);
    return `<article class="card cart-item">
              <button class="remove" data-idx="${i}">×</button>
              <img src="${p.image}" alt="${p.title}">
              <div>
                <h3>${p.title}</h3>
                <p class="price">${form(p.price)}</p>
              </div>
            </article>`;
  }).join('');

  cont.innerHTML  = html;
  const total     = cart.reduce((s,id)=>s+products.find(p=>p.id===id).price,0);
  totalE.textContent = form(total);
  syncIndex();
}

function form(n){ return n.toLocaleString('es-CO',{style:'currency',currency:'COP'}); }

/*************** HELPERS ****************/
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function syncIndex(){
  const span = parent.document?.getElementById('cartCount');
  if(span) span.textContent = cart.length;
}
