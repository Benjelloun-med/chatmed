const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Room = require('../models/room.model');
const Message = require('../models/message.model');

// Map pour stocker les utilisateurs connectés
const connectedUsers = new Map();

// Configurer Socket.io
const setupSocketIO = (io) => {
  // Middleware d'authentification pour Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentification requise'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      console.error('Erreur d\'authentification Socket.io:', error.message);
      next(new Error('Authentification invalide'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté: ${socket.user.username} (${socket.id})`);
    
    // Ajouter l'utilisateur à la map des utilisateurs connectés
    connectedUsers.set(socket.user._id.toString(), socket.id);
    
    // Rejoindre automatiquement les salles auxquelles l'utilisateur appartient
    if (socket.user.rooms && socket.user.rooms.length > 0) {
      socket.user.rooms.forEach(roomId => {
        socket.join(roomId.toString());
      });
    }
    
    // Émettre la liste des utilisateurs connectés
    io.emit('users_online', Array.from(connectedUsers.keys()));
    
    // Recevoir un message
    socket.on('send_message', async (messageData) => {
      try {
        const { text, roomId } = messageData;
        
        // Vérifier si l'utilisateur est membre de la salle
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Salle non trouvée' });
          return;
        }
        
        if (!room.members.includes(socket.user._id)) {
          socket.emit('error', { message: 'Vous devez être membre de cette salle pour envoyer un message' });
          return;
        }
        
        // Créer un nouveau message
        const newMessage = new Message({
          text,
          sender: socket.user._id,
          room: roomId
        });
        
        // Sauvegarder le message
        await newMessage.save();
        
        // Remplir les informations du sender pour l'envoi
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username')
          .populate('mentions', 'username');
        
        // Envoyer le message à tous les membres de la salle
        io.to(roomId).emit('new_message', populatedMessage);
        
        // Notifier les utilisateurs mentionnés
        if (newMessage.mentions && newMessage.mentions.length > 0) {
          for (const mentionedUserId of newMessage.mentions) {
            // Créer une notification
            await User.findByIdAndUpdate(
              mentionedUserId,
              {
                $push: {
                  notifications: {
                    message: `Vous avez été mentionné par ${socket.user.username} dans ${room.name}`,
                    room: roomId
                  }
                }
              }
            );
            
            // Envoyer une notification en temps réel si l'utilisateur est connecté
            const mentionedSocketId = connectedUsers.get(mentionedUserId.toString());
            if (mentionedSocketId) {
              io.to(mentionedSocketId).emit('notification', {
                message: `Vous avez été mentionné par ${socket.user.username} dans ${room.name}`,
                room: roomId,
                from: socket.user.username
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur d\'envoi de message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });
    
    // Rejoindre une salle
    socket.on('join_room', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Salle non trouvée' });
          return;
        }
        
        // Ajouter l'utilisateur à la salle dans la base de données
        if (!room.members.includes(socket.user._id)) {
          room.members.push(socket.user._id);
          await room.save();
          
          // Ajouter la salle à l'utilisateur
          await User.findByIdAndUpdate(
            socket.user._id,
            { $push: { rooms: roomId } }
          );
        }
        
        // Rejoindre la salle Socket.io
        socket.join(roomId);
        
        // Informer les autres membres
        socket.to(roomId).emit('user_joined', {
          room: roomId,
          user: {
            id: socket.user._id,
            username: socket.user.username
          }
        });
        
        socket.emit('room_joined', { roomId });
      } catch (error) {
        console.error('Erreur de connexion à la salle:', error);
        socket.emit('error', { message: 'Erreur lors de la connexion à la salle' });
      }
    });
    
    // Quitter une salle
    socket.on('leave_room', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Salle non trouvée' });
          return;
        }
        
        // Retirer l'utilisateur de la salle dans la base de données
        if (room.members.includes(socket.user._id)) {
          room.members = room.members.filter(
            member => member.toString() !== socket.user._id.toString()
          );
          await room.save();
          
          // Retirer la salle de l'utilisateur
          await User.findByIdAndUpdate(
            socket.user._id,
            { $pull: { rooms: roomId } }
          );
        }
        
        // Quitter la salle Socket.io
        socket.leave(roomId);
        
        // Informer les autres membres
        socket.to(roomId).emit('user_left', {
          room: roomId,
          user: {
            id: socket.user._id,
            username: socket.user.username
          }
        });
        
        socket.emit('room_left', { roomId });
      } catch (error) {
        console.error('Erreur lors de la sortie de la salle:', error);
        socket.emit('error', { message: 'Erreur lors de la sortie de la salle' });
      }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_typing', {
        room: roomId,
        user: {
          id: socket.user._id,
          username: socket.user.username
        }
      });
    });
    
    socket.on('stop_typing', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_stop_typing', {
        room: roomId,
        user: {
          id: socket.user._id,
          username: socket.user.username
        }
      });
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.user.username} (${socket.id})`);
      
      // Retirer l'utilisateur de la map des utilisateurs connectés
      connectedUsers.delete(socket.user._id.toString());
      
      // Émettre la liste mise à jour des utilisateurs connectés
      io.emit('users_online', Array.from(connectedUsers.keys()));
    });
  });
};

module.exports = { setupSocketIO }; 