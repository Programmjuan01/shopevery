// --- auth.js -------------------------------------------------------
const API       = '/api';                 // mismo host => sin CORS
const TOKEN_KEY = 'shopevery-token';
const UID_KEY   = 'shopevery-uid';
const NAME_KEY  = 'user-name';            // para guardar el nombre

// -------- Helpers Token --------------------------------------------
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const isLogged = () => !!getToken();
export const logout   = () => sessionStorage.clear();
export const getUid   = () => sessionStorage.getItem(UID_KEY);
export const getName  = () => sessionStorage.getItem(NAME_KEY);

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
  // 200 → { msg: "Usuario registrado" }
}

// ------------- Login actualizado -----------------------------------
export async function login(email, password) {
  const r = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if (!r.ok) throw data;

  // Guardar en sessionStorage
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(UID_KEY,   data.uid);
  sessionStorage.setItem(NAME_KEY,  data.name);

  return data.name;
}
