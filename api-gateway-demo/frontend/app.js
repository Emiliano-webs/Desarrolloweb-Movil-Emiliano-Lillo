const GATEWAY = 'http://localhost:3000/api';
const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('token');

// Todas las peticiones pasan por aquí y llevan el token
async function pedir(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;

  const resp = await fetch(GATEWAY + ruta, { ...opciones, headers });
  const datos = resp.status === 204 ? null : await resp.json();
  if (!resp.ok) throw new Error(datos?.error || 'Error ' + resp.status);
  return datos;
}

function actualizarVista() {
  $('seccion-login').hidden = !!token;
  $('seccion-productos').hidden = !token;
  if (token) cargarProductos();
}

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const datos = await pedir('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: $('usuario').value, clave: $('clave').value }),
    });
    token = datos.token;
    sessionStorage.setItem('token', token);
    actualizarVista();
  } catch (err) {
    $('estado-login').textContent = err.message;
  }
});
async function cargarProductos() {
  try {
    const productos = await pedir('/productos');
    const lista = $('lista');
    lista.innerHTML = '';
    productos.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.nombre} — $${p.precio} `;
      const btn = document.createElement('button');
      btn.textContent = 'Eliminar';
      btn.addEventListener('click', () => eliminarProducto(p.id));
      li.appendChild(btn);
      lista.appendChild(li);
    });
  } catch (err) {
    $('estado-productos').textContent = err.message;
  }
}

$('form-producto').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await pedir('/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre: $('nombre').value, precio: $('precio').value }),
    });
    e.target.reset();
    cargarProductos();
  } catch (err) {
    $('estado-productos').textContent = err.message;
  }
});

async function eliminarProducto(id) {
  try {
    await pedir('/productos/' + id, { method: 'DELETE' });
    cargarProductos();
  } catch (err) {
    $('estado-productos').textContent = err.message;
  }
}

actualizarVista();