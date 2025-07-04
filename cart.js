// ---------- Constantes ----------
const LS_PRODUCTS = 'shopevery-products';
const CART_KEY    = 'shopevery-cart';

// ---------- Datos ----------
const products = JSON.parse(localStorage.getItem(LS_PRODUCTS)) || [];
const cart     = JSON.parse(localStorage.getItem(CART_KEY))   || [];

const container = document.getElementById('cartContainer');
const totalEl   = document.getElementById('cartTotal');

// ---------- Util ----------
const money = n => n.toLocaleString('es-CO', {style:'currency', currency:'COP'});

// ---------- Render ----------
function render(){
  if(!cart.length){
    container.innerHTML = '<p>Carrito vacío 😢</p>';
    totalEl.textContent = money(0);
    return;
  }

  const rows = cart.map(id=>{
    const p = products.find(x=>x.id===id);
    return `<article class="card cart-item">
              <img src="${p.image}" alt="${p.title}">
              <div>
                <h3>${p.title}</h3>
                <p class="price">${money(p.price)}</p>
              </div>
            </article>`;
  }).join('');

  container.innerHTML = rows;

  window.total = cart.reduce((s,id)=>s+products.find(p=>p.id===id).price,0);
  totalEl.textContent = money(window.total);
}
render();

// ---------- Pago Nequi vía backend Wompi ----------
async function payWithNequi(){
  if(!cart.length) return alert('Carrito vacío');

  const payload = {
    amount: window.total.toFixed(2),
    email : prompt('Correo para la factura'),
    phone : prompt('Celular registrado en Nequi (10 dígitos)')
  };

  const res = await fetch('https://TU_BACKEND.onrender.com/api/pay/nequi',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(payload)
              });
  const {checkout_url} = await res.json();
  if(checkout_url){
    window.location = checkout_url;
  }else{
    alert('Error generando pago, revisa la consola');
    console.error(await res.text());
  }
}

document.getElementById('payBtn').addEventListener('click', payWithNequi);
