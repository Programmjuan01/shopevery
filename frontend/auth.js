// --- auth.js -------------------------------------------------------
const API       = '/api';                 // mismo host => sin CORS
const TOKEN_KEY = 'shopevery-token';
const UID_KEY   = 'shopevery-uid';

// -------- Helpers Token --------------------------------------------
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const isLogged = () => !!getToken();
export const logout   = () => localStorage.removeItem(TOKEN_KEY);
export const getUid   = () => localStorage.getItem(UID_KEY);

// -------- Util para parsear siempre JSON ---------------------------
async function parseJSON(r) {
  const txt = await r.text();
  try { return JSON.parse(txt); }
  catch { return { msg: txt || r.statusText }; }   // si llega HTML
}

// -------- Registro --------------------------------------------------
export async function register(name, email, password) {
  const r = await fetch(`${API}/register`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ name, email, password })
  });
  if (!r.ok) throw await parseJSON(r);
  /* 200 → no devuelve nada más que {msg:"Usuario registrado"} */
}

// ------------- login actualizado ---------------------------------
export async function login(email, password) {
  const r = await fetch('/api/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if (!r.ok) throw data;

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(UID_KEY,   data.uid);
  return data.name;                              // devolvemos name
}