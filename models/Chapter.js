const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
});

module.exports = mongoose.model('Chapter', chapterSchema);