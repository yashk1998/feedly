const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  lastFetched: Date,
  items: [{
    title: String,
    link: String,
    description: String,
    published: Date,
    author: String,
    read: {
      type: Boolean,
      default: false
    },
    saved: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    default: 'FEEDS'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feed', feedSchema); 