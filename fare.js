const mongoose = require('mongoose');

const fareSchema = new mongoose.Schema({
  route: {
    type: String,
    required: true,
    enum: ['Nairobi-Nakuru', 'Nairobi-Thika', 'Nairobi-Ngong'] 
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Fare', fareSchema);