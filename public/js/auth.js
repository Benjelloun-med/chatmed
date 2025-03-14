// Gestion de l'authentification
const authModule = (() => {
  // Éléments DOM
  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');

  // Variables
  const API_URL = '/api';
  let currentUser = null;
  let authToken = null;

  // Initialisation
  const init = () => {
    // Vérifier si l'utilisateur est déjà connecté
    checkAuth();

    // Événements des onglets
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    });

    // Événements des formulaires
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
  };

  // Vérifier l'authentification
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
      authToken = token;
      currentUser = user;
      showChat();
    } else {
      showAuth();
    }
  };

  // Gérer la connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      loginError.textContent = 'Veuillez remplir tous les champs';
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        loginError.textContent = data.message || 'Erreur de connexion';
        return;
      }
      
      // Stocker les informations d'authentification
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      authToken = data.token;
      currentUser = data.user;
      
      // Réinitialiser le formulaire
      loginForm.reset();
      loginError.textContent = '';
      
      // Afficher l'interface de chat
      showChat();
      
      // Initialiser Socket.io
      appModule.initSocket(authToken);
      
      // Charger les salles
      roomsModule.loadRooms();
    } catch (error) {
      console.error('Erreur de connexion:', error);
      loginError.textContent = 'Erreur de connexion au serveur';
    }
  };

  // Gérer l'inscription
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!username || !email || !password) {
      registerError.textContent = 'Veuillez remplir tous les champs';
      return;
    }
    
    if (password.length < 6) {
      registerError.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        registerError.textContent = data.message || 'Erreur d\'inscription';
        return;
      }
      
      // Stocker les informations d'authentification
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      authToken = data.token;
      currentUser = data.user;
      
      // Réinitialiser le formulaire
      registerForm.reset();
      registerError.textContent = '';
      
      // Afficher l'interface de chat
      showChat();
      
      // Initialiser Socket.io
      appModule.initSocket(authToken);
      
      // Charger les salles
      roomsModule.loadRooms();
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      registerError.textContent = 'Erreur de connexion au serveur';
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    // Supprimer les informations d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    authToken = null;
    currentUser = null;
    
    // Déconnecter Socket.io
    appModule.disconnectSocket();
    
    // Afficher l'interface d'authentification
    showAuth();
  };

  // Afficher l'interface d'authentification
  const showAuth = () => {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  };

  // Afficher l'interface de chat
  const showChat = () => {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Afficher le nom d'utilisateur
    usernameDisplay.textContent = currentUser.username;
  };

  // Obtenir le token d'authentification
  const getToken = () => authToken;

  // Obtenir l'utilisateur actuel
  const getCurrentUser = () => currentUser;

  // API publique
  return {
    init,
    getToken,
    getCurrentUser
  };
})();

// Initialiser le module d'authentification lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', authModule.init); 