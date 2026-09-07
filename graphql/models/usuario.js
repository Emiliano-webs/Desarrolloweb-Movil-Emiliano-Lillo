const mongoose = require('mongoose');

// Esquema del usuario: define los campos que se guardarán en MongoDB
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  pass: {
    type: String,
    required: true
  }
});

// Se exporta el modelo para poder usarlo en los resolvers
module.exports = mongoose.model('Usuario', usuarioSchema);
