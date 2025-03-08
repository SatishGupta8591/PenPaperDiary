const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return v.startsWith('data:image/');
      },
      message: 'Invalid image format'
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Diary', diarySchema);