const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
});

module.exports = mongoose.model('Section', sectionSchema);