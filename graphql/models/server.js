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