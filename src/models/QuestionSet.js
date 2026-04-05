const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  prompt: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  hint: { type: String },
});

const questionSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    grade: { type: String, required: true },
    subject: { type: String, required: true },
    stream: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String },
    estimatedMinutes: { type: Number, default: 10 },
    rating: { type: Number, default: 4.5 },
    badge: { type: String },
    accentColorValue: { type: Number },
    isFeatured: { type: Boolean, default: false },
    questions: [questionSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

questionSetSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const QuestionSet = mongoose.model('QuestionSet', questionSetSchema);

module.exports = QuestionSet;
