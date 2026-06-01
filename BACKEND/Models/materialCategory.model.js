// BACKEND/Models/materialCategory.model.js
const mongoose = require("mongoose");

const materialCategorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [24, "Code must be at most 24 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [120, "Name must be at most 120 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description must be at most 300 characters"],
    },
    measurementType: {
      type: String,
      required: [true, "Measurement type is required"],
      trim: true,
      maxlength: [50, "Measurement type must be at most 50 characters"],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MaterialCategory ||
  mongoose.model("MaterialCategory", materialCategorySchema);
