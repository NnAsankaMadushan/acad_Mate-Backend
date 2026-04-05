const mongoose = require('mongoose');

const pastPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    grade: { type: String, required: true },
    subject: { type: String, required: true },
    stream: { type: String, required: true },
    year: { type: Number, required: true },
    examType: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    storagePath: { type: String },
    pages: { type: Number, default: 0 },
    fileSize: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

pastPaperSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const PastPaper = mongoose.model('PastPaper', pastPaperSchema);

module.exports = PastPaper;
