const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour extraire les mentions (@username) du texte du message
messageSchema.pre('save', async function(next) {
  try {
    if (this.isModified('text')) {
      const mentionRegex = /@(\w+)/g;
      const mentionUsernames = [...this.text.matchAll(mentionRegex)].map(match => match[1]);
      
      if (mentionUsernames.length > 0) {
        const User = mongoose.model('User');
        const mentionedUsers = await User.find({ username: { $in: mentionUsernames } });
        this.mentions = mentionedUsers.map(user => user._id);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 