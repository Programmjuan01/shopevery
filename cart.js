// cart.js
async function payWithNequi(){
  if(!cart.length) return alert('Carrito vacío');

  const payload = {
    amount: total.toFixed(2),          // usa tu variable total
    email : prompt("Correo para la factura"),
    phone : prompt("Celular asociado a Nequi")
  };

  const res  = await fetch("https://TU_BACKEND.onrender.com/api/pay/nequi",{
                method:"POST",
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(payload)
              });
  const {checkout_url} = await res.json();
  window.location = checkout_url;      // salta al widget Nequi
}

document.getElementById('payBtn').addEventListener('click', payWithNequi);