const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Agregado para crear un servidor HTTP
const { Server } = require('socket.io'); // Importar Socket.IO

require('dotenv').config();

const app = express();

// Crear servidor HTTP
const server = http.createServer(app);

// Crear instancia de Socket.IO y conectarlo al servidor HTTP
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middlewares
app.use(express.json());
app.use(cors());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Socket.IO lógica de conexión
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // Escuchar un evento de ejemplo desde el cliente
  socket.on('message', (data) => {
    console.log('Mensaje recibido:', data);
    // Enviar respuesta al cliente
    socket.emit('message', 'Hola desde el servidor');
  });

  // Evento de desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Importar rutas y pasar `io` como argumento
const characterRoutes = require('./routes/characters')(io);
app.use('/api/characters', characterRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Iniciar servidor en el puerto definido
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
