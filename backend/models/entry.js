const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
