const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');                                  
const { JWT_SECRET, GATEWAY_PORT, API_URL } = require('../config');   

const app = express();
app.use(cors());
app.use(express.json());


function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta el token (Authorization: Bearer ...)' });

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

async function reenviar(req, res, destino) {
  const url = destino + req.originalUrl.replace(/^\/api/, '');
  const tieneBody = req.body && Object.keys(req.body).length > 0;

  try {
    const respuesta = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.usuario && { 'X-Usuario': req.usuario.usuario }),    
      },
      body: tieneBody ? JSON.stringify(req.body) : undefined,
    });
    const texto = await respuesta.text();
    res
      .status(respuesta.status)
      .type(respuesta.headers.get('content-type') || 'application/json')
      .send(texto);
  } catch {
    res.status(502).json({ error: 'El servicio no está disponible' });
  }
}

const rutas = [
  { prefijo: '/api/auth',      destino: API_URL, protegida: false },
  { prefijo: '/api/productos', destino: API_URL, protegida: true  },
];


rutas.forEach(({ prefijo, destino, protegida }) => {
  const middlewares = protegida ? [verificarToken] : [];
  app.use(prefijo, ...middlewares, (req, res) => reenviar(req, res, destino));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no registrada en el gateway' });
});

app.listen(GATEWAY_PORT, () => console.log(`Gateway en http://localhost:${GATEWAY_PORT}`));