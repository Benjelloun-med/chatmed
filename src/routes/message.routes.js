const express = require('express');
const router = express.Router();
const { 
  createMessage, 
  getRoomMessages, 
  searchMessages,
  markNotificationsAsRead
} = require('../controllers/message.controller');

// Créer un nouveau message
router.post('/', createMessage);

// Obtenir les messages d'une salle
router.get('/room/:roomId', getRoomMessages);

// Rechercher des messages
router.get('/search', searchMessages);

// Marquer les notifications comme lues
router.post('/notifications/read', markNotificationsAsRead);

module.exports = router; 