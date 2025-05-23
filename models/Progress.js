const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  completed: { type: Boolean, default: false },
  attempts: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: String },
    isCorrect: { type: Boolean },
    attemptedAt: { type: Date, default: Date.now },
  }],
  score: { type: Number, default: 0 }, // Score for the chapter (calculated after attempts)
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Progress', progressSchema);