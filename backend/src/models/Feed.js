const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  published: {
    type: Date,
    required: true
  },
  content: String,
  image: String,
  read: {
    type: Boolean,
    default: false
  },
  bookmarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const feedSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  image: String,
  category: {
    type: String,
    enum: ['News', 'Technology', 'Business', 'Science', 'Sports', 'Entertainment', 'Health', 'Politics', 'Education', 'Other'],
    default: 'Other'
  },
  lastFetched: Date,
  items: [feedItemSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
feedSchema.index({ user: 1, 'items.link': 1 });

const Feed = mongoose.model('Feed', feedSchema);

module.exports = Feed; 