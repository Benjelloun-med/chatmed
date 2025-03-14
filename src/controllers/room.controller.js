const Room = require('../models/room.model');
const User = require('../models/user.model');

// Créer une nouvelle salle
const createRoom = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    // Vérifier si la salle existe déjà
    const existingRoom = await Room.findOne({ name });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Une salle avec ce nom existe déjà'
      });
    }

    // Créer une nouvelle salle
    const newRoom = new Room({
      name,
      description,
      category,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    // Sauvegarder la salle dans la base de données
    await newRoom.save();

    // Ajouter la salle à l'utilisateur qui l'a créée
    await User.findByIdAndUpdate(
      req.user._id, 
      { $push: { rooms: newRoom._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Salle créée avec succès',
      room: newRoom
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la salle'
    });
  }
};

// Obtenir toutes les salles
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username email')
      .populate('members', 'username');

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des salles'
    });
  }
};

// Obtenir une salle par son ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('createdBy', 'username email')
      .populate('members', 'username email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la salle'
    });
  }
};

// Rejoindre une salle
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Vérifier si la salle existe
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est déjà membre de cette salle
    if (room.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà membre de cette salle'
      });
    }
    
    // Ajouter l'utilisateur aux membres de la salle
    room.members.push(req.user._id);
    await room.save();
    
    // Ajouter la salle aux salles de l'utilisateur
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { rooms: roomId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Vous avez rejoint la salle avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la tentative de rejoindre la salle'
    });
  }
};

// Quitter une salle
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Vérifier si la salle existe
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est membre de cette salle
    if (!room.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'êtes pas membre de cette salle'
      });
    }
    
    // Retirer l'utilisateur des membres de la salle
    room.members = room.members.filter(
      member => member.toString() !== req.user._id.toString()
    );
    await room.save();
    
    // Retirer la salle des salles de l'utilisateur
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { rooms: roomId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Vous avez quitté la salle avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la tentative de quitter la salle'
    });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom
}; 