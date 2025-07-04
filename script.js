// ---------- Datos iniciales ----------
const seedProducts = [
  {
    id: crypto.randomUUID(),
    title: 'Camisa clásica',
    price: 29.99,
    image: 'https://cdn.pixabay.com/photo/2023/09/02/11/43/woman-8228723_1280.jpg'
  },
  {
    id: crypto.randomUUID(),
    title: 'Jeans',
    price: 49.99,
    image: 'https://cdn.pixabay.com/photo/2017/12/30/22/07/jeans-3051102_1280.jpg'
  },
  {
    id: crypto.randomUUID(),
    title: 'Zapatos clásicos',
    price: 79.99,
    image: 'https://cdn.pixabay.com/photo/2021/03/08/12/31/oxford-shoes-6078993_1280.jpg'
  }
];

// ---------- Estado en localStorage ----------
const LS_KEY = 'shopevery-products';
const CART_KEY = 'shopevery-cart';

const products = JSON.parse(localStorage.getItem(LS_KEY)) || seedProducts;
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// ---------- Render de productos ----------
const grid = document.getElementById('productGrid');
const cartCount = document.getElementById('cartCount');

function renderProducts() {
  grid.innerHTML = products.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p class="price">$${p.price.toFixed(2)}</p>
      <button data-id="${p.id}">Añadir al carrito</button>
    </article>
  `).join('');
}
renderProducts();

// ---------- Carrito ----------
function addToCart(id) {
  cart.push(id);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  cartCount.textContent = cart.length;
}
updateCartCount();

// Delegación de eventos para botones dentro de la grilla
grid.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    const id = e.target.dataset.id;
    addToCart(id);
    alert('Producto añadido 🛒');
  }
});

// ---------- Subir nuevo anuncio ----------
const addForm = document.getElementById('addProductForm');

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(addForm);
  const newProd = {
    id: crypto.randomUUID(),
    title: data.get('title'),
    price: parseFloat(data.get('price')),
    image: data.get('image')
  };
  products.push(newProd);
  localStorage.setItem(LS_KEY, JSON.stringify(products));
  renderProducts();
  addForm.reset();
  alert('¡Anuncio publicado!');
});
