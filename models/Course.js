const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who created the course
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', courseSchema);