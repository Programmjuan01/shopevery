// cart.js
const LS_PRODUCTS = 'shopevery-products';
const CART_KEY = 'shopevery-cart';

const allProducts = JSON.parse(localStorage.getItem(LS_PRODUCTS)) || [];
let cart        = JSON.parse(localStorage.getItem(CART_KEY))   || [];

const container = document.getElementById('cartContainer');
const totalEl   = document.getElementById('cartTotal');

function money(n){ return n.toLocaleString('es-CO',{style:'currency',currency:'COP'}); }

function render(){
  if(!cart.length){ container.innerHTML='<p>Carrito vacío 😢</p>'; totalEl.textContent=money(0); return; }

  const rows = cart.map(id=>{
    const p = allProducts.find(x=>x.id===id);
    return `<article class="card cart-item">
        <img src="${p.image}" alt="${p.title}">
        <div>
          <h3>${p.title}</h3>
          <p class="price">${money(p.price)}</p>
        </div>
     </article>`;
  }).join('');
  container.innerHTML = rows;

  const total = cart.reduce((s,id)=>s+allProducts.find(p=>p.id===id).price,0);
  totalEl.textContent = money(total);
}

render();

import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js'; // opcional para invoice

const handler = ePayco.checkout.configure({
  key: 'TU_PUBLIC_KEY',   // ← reemplaza
  test: true              // true = sandbox
});

document.getElementById('payBtn').addEventListener('click', () => {
  if(!cart.length) return alert('Carrito vacío');

  const total = cart.reduce((s,id)=>s+allProducts.find(p=>p.id===id).price,0)
                     .toFixed(2);

  handler.open({
    external      : 'false',     // abre modal
    name          : 'Compra Shopevery',
    description   : 'Pago con PSE',
    invoice       : `FAC-${nanoid(6)}`,
    currency      : 'cop',
    amount        : total,
    country       : 'co',
    lang          : 'es',
    response      : 'https://programmjuan01.github.io/shopevery/thanks.html',
    confirmation  : 'https://TU_BACKEND/confirm', // opcional backend Flask
    // Mostrar solo PSE ocultando el resto
    methodsDisable: ['TDC','SP','CASH','DP']       // bloquea otros métodos
  });
});
