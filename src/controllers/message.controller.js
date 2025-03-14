const Message = require('../models/message.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');

// Créer un nouveau message
const createMessage = async (req, res) => {
  try {
    const { text, roomId } = req.body;
    
    // Vérifier si la salle existe
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est membre de la salle
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être membre de cette salle pour envoyer un message'
      });
    }
    
    // Créer un nouveau message
    const newMessage = new Message({
      text,
      sender: req.user._id,
      room: roomId
    });
    
    // Sauvegarder le message dans la base de données
    await newMessage.save();
    
    // Après la sauvegarde, mentions est rempli par le middleware du modèle
    // Maintenant, notifier les utilisateurs mentionnés
    if (newMessage.mentions && newMessage.mentions.length > 0) {
      for (const mentionedUserId of newMessage.mentions) {
        await User.findByIdAndUpdate(
          mentionedUserId,
          {
            $push: {
              notifications: {
                message: `Vous avez été mentionné par ${req.user.username} dans ${room.name}`,
                room: roomId
              }
            }
          }
        );
      }
    }
    
    // Populate le message avec les informations du sender
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username')
      .populate('mentions', 'username');
    
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: populatedMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
};

// Obtenir les messages d'une salle
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Vérifier si la salle existe
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Calculer le saut pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtenir les messages avec pagination
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 }) // Du plus récent au plus ancien
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username')
      .populate('mentions', 'username');
    
    // Obtenir le nombre total de messages
    const totalMessages = await Message.countDocuments({ room: roomId });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      currentPage: parseInt(page),
      messages: messages.reverse() // Renvoyer dans l'ordre chronologique
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
};

// Rechercher des messages
const searchMessages = async (req, res) => {
  try {
    const { query, roomId } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Un terme de recherche est requis'
      });
    }
    
    let searchQuery = { text: { $regex: query, $options: 'i' } };
    
    // Si un roomId est fourni, filtrer par salle
    if (roomId) {
      // Vérifier si la salle existe
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Salle non trouvée'
        });
      }
      
      searchQuery.room = roomId;
    }
    
    // Rechercher les messages
    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username')
      .populate('room', 'name')
      .populate('mentions', 'username');
    
    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de messages'
    });
  }
};

// Marquer les notifications comme lues
const markNotificationsAsRead = async (req, res) => {
  try {
    // Mettre à jour toutes les notifications non lues
    await User.updateOne(
      { _id: req.user._id },
      { 
        $set: { 
          "notifications.$[elem].read": true 
        } 
      },
      { 
        arrayFilters: [{ "elem.read": false }],
        multi: true 
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Notifications marquées comme lues'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notifications'
    });
  }
};

module.exports = {
  createMessage,
  getRoomMessages,
  searchMessages,
  markNotificationsAsRead
}; 