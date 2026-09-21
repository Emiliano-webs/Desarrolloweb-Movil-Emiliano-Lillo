const express = require('express');
const { API_PORT } = require('../config');

const app = express();
app.use(express.json()); // permite leer req.body

let productos = [
  { id: 1, nombre: 'Teclado', precio: 15000 },
  { id: 2, nombre: 'Mouse', precio: 8000 },
];
let siguienteId = 3;

app.get('/productos', (req, res) => {
  res.json(productos);
});

app.post('/productos', (req, res) => {
  const { nombre, precio } = req.body || {};
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'nombre y precio son obligatorios' });
  }
  const nuevo = { id: siguienteId++, nombre, precio: Number(precio) };
  productos.push(nuevo);
  res.status(201).json(nuevo);
});

app.delete('/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const antes = productos.length;
  productos = productos.filter((p) => p.id !== id);
  if (productos.length === antes) return res.status(404).json({ error: 'Producto no encontrado' });
  res.status(204).end();
});
const jwt = require('jsonwebtoken');
const { JWT_SECRET, API_PORT } = require('../config'); // reemplaza el import anterior

const usuarios = [{ id: 1, usuario: 'mimi', clave: '1234' }];

app.post('/auth/login', (req, res) => {
  const { usuario, clave } = req.body || {};
  const u = usuarios.find((x) => x.usuario === usuario && x.clave === clave);
  if (!u) return res.status(401).json({ error: 'Usuario o clave incorrectos' });

  const token = jwt.sign({ id: u.id, usuario: u.usuario }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.listen(API_PORT, () => console.log(`API en http://localhost:${API_PORT}`));
