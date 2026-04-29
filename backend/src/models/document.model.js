const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
    },
    extractedText: {
      type: String,
      default: "",
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    extractionMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    classification: {
      type: String,
      enum: ["Resume", "Notes", "Research Paper", "Report", "Assignment", "Unknown"],
      default: "Unknown",
    },
    keywords: {
      type: [String],
      default: [],
    },
    readabilityScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ title: "text", originalName: "text" });

module.exports = mongoose.model("Document", documentSchema);
