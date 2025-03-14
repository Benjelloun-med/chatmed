// Module principal de l'application
const appModule = (() => {
  // Variables
  let socket = null;
  
  // Initialisation
  const init = () => {
    console.log('Initialisation de l\'application ChatMed');
  };
  
  // Initialiser Socket.io
  const initSocket = (token) => {
    if (socket) {
      socket.disconnect();
    }
    
    // Connexion à Socket.io avec le token d'authentification
    socket = io({
      auth: {
        token
      }
    });
    
    // Événements Socket.io
    setupSocketEvents();
  };
  
  // Configurer les événements Socket.io
  const setupSocketEvents = () => {
    // Connexion établie
    socket.on('connect', () => {
      console.log('Connecté au serveur Socket.io');
    });
    
    // Erreur de connexion
    socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.io:', error.message);
    });
    
    // Nouveau message
    socket.on('new_message', (message) => {
      chatModule.addMessage(message);
    });
    
    // Notification
    socket.on('notification', (notification) => {
      chatModule.addNotification({
        message: notification.message,
        room: notification.room,
        read: false,
        createdAt: new Date()
      });
    });
    
    // Utilisateurs en ligne
    socket.on('users_online', (userIds) => {
      updateOnlineUsers(userIds);
    });
    
    // Utilisateur a rejoint une salle
    socket.on('user_joined', (data) => {
      console.log(`${data.user.username} a rejoint la salle`);
    });
    
    // Utilisateur a quitté une salle
    socket.on('user_left', (data) => {
      console.log(`${data.user.username} a quitté la salle`);
    });
    
    // Utilisateur est en train d'écrire
    socket.on('user_typing', (data) => {
      chatModule.showTypingIndicator(data.user);
    });
    
    // Utilisateur a arrêté d'écrire
    socket.on('user_stop_typing', (data) => {
      chatModule.hideTypingIndicator(data.user.id);
    });
    
    // Erreur
    socket.on('error', (error) => {
      console.error('Erreur Socket.io:', error.message);
      alert(error.message);
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.io');
    });
  };
  
  // Mettre à jour la liste des utilisateurs en ligne
  const updateOnlineUsers = (userIds) => {
    const onlineUsersList = document.getElementById('online-users-list');
    onlineUsersList.innerHTML = '';
    
    if (userIds.length === 0) {
      onlineUsersList.innerHTML = '<p>Aucun utilisateur en ligne</p>';
      return;
    }
    
    // Récupérer les informations des utilisateurs
    fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${authModule.getToken()}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const onlineUsers = data.users.filter(user => userIds.includes(user._id));
        
        onlineUsers.forEach(user => {
          const userElement = document.createElement('div');
          userElement.classList.add('user-item');
          userElement.innerHTML = `
            <span>${user.username}</span>
            <span class="online-indicator"></span>
          `;
          onlineUsersList.appendChild(userElement);
        });
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      });
  };
  
  // Envoyer un message
  const sendMessage = (text, roomId) => {
    if (!socket || !socket.connected) {
      alert('Vous n\'êtes pas connecté au serveur');
      return;
    }
    
    socket.emit('send_message', { text, roomId });
  };
  
  // Rejoindre une salle
  const joinRoom = (roomId) => {
    if (!socket || !socket.connected) {
      alert('Vous n\'êtes pas connecté au serveur');
      return;
    }
    
    socket.emit('join_room', roomId);
  };
  
  // Quitter une salle
  const leaveRoom = (roomId) => {
    if (!socket || !socket.connected) {
      alert('Vous n\'êtes pas connecté au serveur');
      return;
    }
    
    socket.emit('leave_room', roomId);
  };
  
  // Indiquer que l'utilisateur est en train d'écrire
  const startTyping = (roomId) => {
    if (!socket || !socket.connected) return;
    
    socket.emit('typing', { roomId });
  };
  
  // Indiquer que l'utilisateur a arrêté d'écrire
  const stopTyping = (roomId) => {
    if (!socket || !socket.connected) return;
    
    socket.emit('stop_typing', { roomId });
  };
  
  // Déconnecter Socket.io
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
  
  // API publique
  return {
    init,
    initSocket,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    disconnectSocket
  };
})();

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', appModule.init); 