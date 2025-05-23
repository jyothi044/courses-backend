const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  type: {
    type: String,
    enum: ['mcq', 'fill-in-the-blank', 'text-based', 'audio-based'],
    required: true,
  },
  questionText: { type: String, required: true },
  options: [{ type: String }], // For MCQ
  correctAnswer: { type: String, required: true }, // For MCQ/fill-in-the-blank/audio-based
  media: { type: String }, // URL to image/audio (optional)
});

module.exports = mongoose.model('Question', questionSchema);