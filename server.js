const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./src/routes/auth.routes');
const roomRoutes = require('./src/routes/room.routes');
const messageRoutes = require('./src/routes/message.routes');

// Middleware
const { verifyToken } = require('./src/middleware/auth.middleware');

// Config
const { connectDB } = require('./src/config/db.config');

// Socket event handlers
const { setupSocketIO } = require('./src/utils/socket.utils');

// Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', verifyToken, roomRoutes);
app.use('/api/messages', verifyToken, messageRoutes);

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Connect to MongoDB
connectDB();

// Socket.io setup
setupSocketIO(io);

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 