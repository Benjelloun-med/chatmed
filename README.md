# ChatMed - Plateforme de Discussion pour Étudiants

ChatMed est une plateforme de discussion en temps réel dédiée aux étudiants pour échanger sur des sujets académiques et collaborer sur leurs projets.

## Fonctionnalités

- Authentification avec login et mot de passe
- Chat multi-salles par matière (Maths, Informatique, Physique, etc.)
- Messagerie en temps réel avec Socket.io
- Mentions d'utilisateurs (@pseudo)
- Système de notifications
- Stockage des conversations dans MongoDB
- Recherche de messages

## Technologies utilisées

- **Backend**: Node.js, Express.js, Socket.io, MongoDB (Mongoose)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Authentification**: JWT (JSON Web Tokens)

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (local ou distant)

## Installation

1. Cloner le dépôt:
   ```
   git clone https://github.com/votre-username/chatmed.git
   cd chatmed
   ```

2. Installer les dépendances:
   ```
   npm install
   ```

3. Configurer les variables d'environnement:
   - Créer un fichier `.env` à la racine du projet
   - Ajouter les variables suivantes:
     ```
     PORT=3000
     MONGO_URI=mongodb://localhost:27017/chatmed
     JWT_SECRET=votre_secret_jwt
     JWT_EXPIRATION=7d
     ```

4. Démarrer le serveur:
   ```
   npm start
   ```
   
   Pour le développement, utilisez:
   ```
   npm run dev
   ```

5. Accéder à l'application:
   ```
   http://localhost:3000
   ```

## Structure du projet

```
chatmed/
├── src/
│   ├── config/         # Configuration (base de données, etc.)
│   ├── controllers/    # Contrôleurs pour les routes
│   ├── middleware/     # Middleware (authentification, etc.)
│   ├── models/         # Modèles Mongoose
│   ├── routes/         # Routes Express
│   └── utils/          # Utilitaires (Socket.io, etc.)
├── public/
│   ├── css/            # Styles CSS
│   └── js/             # Scripts JavaScript
├── views/              # Fichiers HTML
├── server.js           # Point d'entrée de l'application
├── package.json        # Dépendances et scripts
└── .env                # Variables d'environnement
```

## Utilisation

### Inscription et connexion

1. Accédez à la page d'accueil
2. Créez un compte ou connectez-vous avec vos identifiants

### Salles de discussion

1. Parcourez les salles existantes ou créez-en une nouvelle
2. Rejoignez une salle pour commencer à discuter

### Envoi de messages

1. Tapez votre message dans la zone de texte
2. Pour mentionner un utilisateur, utilisez @pseudo
3. Appuyez sur Entrée ou cliquez sur le bouton d'envoi

### Notifications

- Les notifications apparaissent dans le panneau latéral si un utilisateur fait un tag
- Cliquez sur une notification pour accéder directement à la salle concernée

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub. 