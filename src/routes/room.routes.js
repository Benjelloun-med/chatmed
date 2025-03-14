const express = require('express');
const router = express.Router();
const { 
  createRoom, 
  getAllRooms, 
  getRoomById, 
  joinRoom, 
  leaveRoom 
} = require('../controllers/room.controller');

// Créer une nouvelle salle
router.post('/', createRoom);

// Obtenir toutes les salles
router.get('/', getAllRooms);

// Obtenir une salle par son ID
router.get('/:roomId', getRoomById);

// Rejoindre une salle
router.post('/:roomId/join', joinRoom);

// Quitter une salle
router.post('/:roomId/leave', leaveRoom);

module.exports = router; 