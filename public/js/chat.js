// Gestion du chat
const chatModule = (() => {
  // Éléments DOM
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  const notificationsList = document.getElementById('notifications-list');
  const notificationCount = document.getElementById('notification-count');
  
  // Variables
  const API_URL = '/api';
  let messages = [];
  let notifications = [];
  let typingTimeout = null;
  
  // Initialisation
  const init = () => {
    // Événements
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Événement de frappe pour l'indicateur de frappe
    messageInput.addEventListener('input', handleTyping);
    
    // Charger les notifications
    loadNotifications();
  };
  
  // Charger les messages d'une salle
  const loadMessages = async (roomId) => {
    try {
      const token = authModule.getToken();
      
      if (!token) return;
      
      const response = await fetch(`${API_URL}/messages/room/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des messages:', data.message);
        return;
      }
      
      messages = data.messages;
      renderMessages();
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };
  
  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const token = authModule.getToken();
      const user = authModule.getCurrentUser();
      
      if (!token || !user) return;
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des notifications:', data.message);
        return;
      }
      
      notifications = data.user.notifications || [];
      renderNotifications();
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };
  
  // Formater la date en format lisible
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0'); 
    const annee = date.getFullYear();
    
    const heures = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const secondes = String(date.getSeconds()).padStart(2, '0');
    
    return `${jour}/${mois}/${annee} à ${heures}:${minutes}:${secondes}`;
  };
  
  // Afficher les messages
  const renderMessages = () => {
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = '<p class="no-messages">Aucun message dans cette salle</p>';
      return;
    }
    
    const currentUser = authModule.getCurrentUser();
    
    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      
      // Déterminer si le message a été envoyé par l'utilisateur actuel
      if (message.sender._id === currentUser.id) {
        messageElement.classList.add('sent');
      } else {
        messageElement.classList.add('received');
      }
      
      // Formater la date
      const formattedDate = formatDate(message.createdAt);
      
      // Formater le texte avec les mentions
      let messageText = message.text;
      if (message.mentions && message.mentions.length > 0) {
        message.mentions.forEach(mention => {
          const regex = new RegExp(`@${mention.username}`, 'g');
          messageText = messageText.replace(regex, `<strong>@${mention.username}</strong>`);
        });
      }
      
      messageElement.innerHTML = `
        <div class="sender">${message.sender.username}</div>
        <div class="content">${messageText}</div>
        <div class="timestamp">${formattedDate}</div>
      `;
      
      messagesContainer.appendChild(messageElement);
    });
    
    // Faire défiler vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };
  
  // Afficher les notifications
  const renderNotifications = () => {
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p>Aucune notification</p>';
      notificationCount.classList.add('hidden');
      return;
    }
    
    // Compter les notifications non lues
    const unreadCount = notifications.filter(notification => !notification.read).length;
    
    if (unreadCount > 0) {
      notificationCount.textContent = unreadCount;
      notificationCount.classList.remove('hidden');
    } else {
      notificationCount.classList.add('hidden');
    }
    
    // Afficher les 5 dernières notifications
    notifications.slice(0, 5).forEach(notification => {
      const notificationElement = document.createElement('div');
      notificationElement.classList.add('notification-item');
      
      if (!notification.read) {
        notificationElement.classList.add('unread');
      }
      
      // Formater la date avec la nouvelle fonction
      const formattedDate = formatDate(notification.createdAt);
      
      notificationElement.innerHTML = `
        <div class="notification-content">${notification.message}</div>
        <div class="notification-timestamp">${formattedDate}</div>
      `;
      
      notificationElement.addEventListener('click', () => {
        markNotificationAsRead(notification._id);
        
        // Si la notification concerne une salle, ouvrir cette salle
        if (notification.room) {
          roomsModule.setActiveRoom(notification.room);
          loadMessages(notification.room);
        }
      });
      
      notificationsList.appendChild(notificationElement);
    });
  };
  
  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = authModule.getToken();
      
      if (!token) return;
      
      await fetch(`${API_URL}/messages/notifications/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour l'état local des notifications
      notifications = notifications.map(notification => {
        if (notification._id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      renderNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };
  
  // Envoyer un message
  const sendMessage = async () => {
    const text = messageInput.value.trim();
    const roomId = roomsModule.getActiveRoomId();
    
    if (!text || !roomId) return;
    
    try {
      const token = authModule.getToken();
      
      if (!token) return;
      
      // Envoyer le message via Socket.io
      appModule.sendMessage(text, roomId);
      
      // Vider l'input
      messageInput.value = '';
      
      // Arrêter l'indicateur de frappe
      appModule.stopTyping(roomId);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };
  
  // Ajouter un message à la liste
  const addMessage = (message) => {
    messages.push(message);
    renderMessages();
  };
  
  // Ajouter une notification
  const addNotification = (notification) => {
    notifications.unshift(notification);
    renderNotifications();
  };
  
  // Gérer l'indicateur de frappe
  const handleTyping = () => {
    const roomId = roomsModule.getActiveRoomId();
    
    if (!roomId) return;
    
    // Envoyer l'événement de frappe
    appModule.startTyping(roomId);
    
    // Réinitialiser le timeout
    clearTimeout(typingTimeout);
    
    // Définir un nouveau timeout
    typingTimeout = setTimeout(() => {
      appModule.stopTyping(roomId);
    }, 1000);
  };
  
  // Afficher l'indicateur de frappe
  const showTypingIndicator = (user) => {
    // Vérifier si l'indicateur existe déjà
    let typingIndicator = document.getElementById('typing-indicator');
    
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.id = 'typing-indicator';
      typingIndicator.classList.add('typing-indicator');
      messagesContainer.appendChild(typingIndicator);
    }
    
    typingIndicator.textContent = `${user.username} est en train d'écrire...`;
    typingIndicator.setAttribute('data-user', user.id);
    
    // Faire défiler vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };
  
  // Cacher l'indicateur de frappe
  const hideTypingIndicator = (userId) => {
    const typingIndicator = document.getElementById('typing-indicator');
    
    if (typingIndicator && typingIndicator.getAttribute('data-user') === userId) {
      typingIndicator.remove();
    }
  };
  
  // API publique
  return {
    init,
    loadMessages,
    addMessage,
    addNotification,
    showTypingIndicator,
    hideTypingIndicator
  };
})();

// Initialiser le module de chat lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', chatModule.init); 