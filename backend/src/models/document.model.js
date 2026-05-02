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
    fileType: {
      type: String,
      enum: ["pdf", "docx", "txt", "md"],
      default: "pdf",
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
      enum: [
        "Resume",
        "Cover Letter",
        "SOP",
        "Notes",
        "Study Material",
        "Revision Notes",
        "Exam Notes",
        "Assignment",
        "Question Bank",
        "Interview Prep",
        "Lab Manual",
        "Lab Report",
        "Project Report",
        "Research Paper",
        "Case Study",
        "Presentation Slides",
        "Programming Notes",
        "Technical Documentation",
        "API Documentation",
        "System Design Notes",
        "Article",
        "Reference Material",
        "Documentation",
        "Miscellaneous",
        "Unknown",
      ],
      default: "Study Material",
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
