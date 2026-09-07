const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ApolloServer, gql } = require('apollo-server-express');

const Usuario = require('./models/usuario');

// --- Schema GraphQL: tipos, entradas y operaciones ---
const typeDefs = gql`
  type Usuario {
    id: ID!
    nombre: String!
    pass: String!
  }

  input UsuarioInput {
    nombre: String!
    pass: String!
  }

  type Alert {
    message: String!
  }

  type Query {
    getUsuarios: [Usuario]
    getUsuariosById(id: ID!): Usuario
  }

  type Mutation {
    addUsuario(input: UsuarioInput): Usuario
    updUsuario(id: ID!, input: UsuarioInput): Usuario
    delUsuario(id: ID!): Alert
  }
`;

// --- Resolvers: conectan el contrato GraphQL con el modelo de datos ---
const resolvers = {
  Query: {
   getUsuarios: async () => {
  return await Usuario.find().limit(20);
},
    getUsuariosById: async (_, { id }) => {
      return await Usuario.findById(id);
    }
  },
  Mutation: {
    addUsuario: async (_, { input }) => {
      const nuevoUsuario = new Usuario({
        nombre: input.nombre,
        pass: input.pass
      });
      return await nuevoUsuario.save();
    },
    updUsuario: async (_, { id, input }) => {
      return await Usuario.findByIdAndUpdate(
        id,
        { nombre: input.nombre, pass: input.pass },
        { new: true }
      );
    },
    delUsuario: async (_, { id }) => {
      await Usuario.findByIdAndDelete(id);
      return { message: `Usuario con id ${id} eliminado correctamente` };
    }
  }
};

// --- Conexión a MongoDB Atlas ---
const MONGO_URI = 'mongodb+srv://tifflespringdorian_db_user:vbsjQhbbi980Hk43@cluster0.nflw7rv.mongodb.net/graphql_clase10?retryWrites=true&w=majority&appName=Cluster0';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// --- Arranque del servidor ---
async function iniciarServidor() {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log('Graphql Iniciado');
    console.log(`Servidor disponible en http://localhost:${PORT}${server.graphqlPath}`);
  });
}

iniciarServidor();