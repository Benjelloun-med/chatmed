// Gestion des salles
const roomsModule = (() => {
  // Éléments DOM
  const roomsList = document.getElementById('rooms-list');
  const createRoomBtn = document.getElementById('create-room-btn');
  const createRoomModal = document.getElementById('create-room-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const createRoomForm = document.getElementById('create-room-form');
  
  // Variables
  const API_URL = '/api';
  let rooms = [];
  let activeRoomId = null;
  
  // Initialisation
  const init = () => {
    // Événements
    createRoomBtn.addEventListener('click', showCreateRoomModal);
    closeModalBtn.addEventListener('click', hideCreateRoomModal);
    createRoomForm.addEventListener('submit', handleCreateRoom);
    
    // Fermer le modal si on clique en dehors
    window.addEventListener('click', (e) => {
      if (e.target === createRoomModal) {
        hideCreateRoomModal();
      }
    });
  };
  
  // Charger les salles
  const loadRooms = async () => {
    try {
      const token = authModule.getToken();
      
      if (!token) return;
      
      const response = await fetch(`${API_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des salles:', data.message);
        return;
      }
      
      rooms = data.rooms;
      renderRooms();
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    }
  };
  
  // Afficher les salles
  const renderRooms = () => {
    roomsList.innerHTML = '';
    
    if (rooms.length === 0) {
      roomsList.innerHTML = '<p>Aucune salle disponible</p>';
      return;
    }
    
    rooms.forEach(room => {
      const roomElement = document.createElement('div');
      roomElement.classList.add('room-item');
      
      if (activeRoomId === room._id) {
        roomElement.classList.add('active');
      }
      
      roomElement.innerHTML = `
        <h4>${room.name}</h4>
        <p>${room.category}</p>
      `;
      
      roomElement.addEventListener('click', () => {
        setActiveRoom(room._id);
        chatModule.loadMessages(room._id);
      });
      
      roomsList.appendChild(roomElement);
    });
  };
  
  // Définir la salle active
  const setActiveRoom = (roomId) => {
    activeRoomId = roomId;
    
    // Mettre à jour l'affichage des salles
    const roomItems = document.querySelectorAll('.room-item');
    roomItems.forEach(item => {
      item.classList.remove('active');
    });
    
    const activeRoom = rooms.find(room => room._id === roomId);
    
    if (activeRoom) {
      // Mettre à jour l'interface de chat
      document.getElementById('welcome-message').classList.add('hidden');
      document.getElementById('active-chat').classList.remove('hidden');
      document.getElementById('active-room-name').textContent = activeRoom.name;
      document.getElementById('active-room-description').textContent = activeRoom.description;
      
      // Rejoindre la salle via Socket.io
      appModule.joinRoom(roomId);
      
      // Mettre en évidence la salle active dans la liste
      const roomItems = document.querySelectorAll('.room-item');
      roomItems.forEach(item => {
        if (item.querySelector('h4').textContent === activeRoom.name) {
          item.classList.add('active');
        }
      });
    }
  };
  
  // Afficher le modal de création de salle
  const showCreateRoomModal = () => {
    createRoomModal.classList.remove('hidden');
  };
  
  // Cacher le modal de création de salle
  const hideCreateRoomModal = () => {
    createRoomModal.classList.add('hidden');
    createRoomForm.reset();
  };
  
  // Gérer la création d'une salle
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('room-name').value;
    const description = document.getElementById('room-description').value;
    const category = document.getElementById('room-category').value;
    
    if (!name || !description || !category) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const token = authModule.getToken();
      
      if (!token) return;
      
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, category })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.message || 'Erreur lors de la création de la salle');
        return;
      }
      
      // Ajouter la nouvelle salle à la liste
      rooms.push(data.room);
      renderRooms();
      
      // Fermer le modal
      hideCreateRoomModal();
      
      // Activer la nouvelle salle
      setActiveRoom(data.room._id);
      chatModule.loadMessages(data.room._id);
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error);
      alert('Erreur lors de la création de la salle');
    }
  };
  
  // Obtenir la salle active
  const getActiveRoom = () => {
    return rooms.find(room => room._id === activeRoomId);
  };
  
  // Obtenir l'ID de la salle active
  const getActiveRoomId = () => activeRoomId;
  
  // API publique
  return {
    init,
    loadRooms,
    getActiveRoom,
    getActiveRoomId
  };
})();

// Initialiser le module des salles lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', roomsModule.init); 