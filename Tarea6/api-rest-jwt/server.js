require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('./models/usuario');

const app = express();
app.use(cors());
app.use(express.json());

// --- Conexión a MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// --- Endpoint de registro ---
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Encriptar la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptado = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      email,
      password: passwordEncriptado
    });

    await nuevoUsuario.save();

    res.status(201).json({ message: 'Usuario registrado correctamente', id: nuevoUsuario._id });
  } catch (error) {
    // Error típico: email duplicado (unique: true)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- Endpoint de login ---
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    // Buscar el usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar el password ingresado con el hash guardado
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// --- Arranque del servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor REST corriendo en http://localhost:${PORT}`);
});