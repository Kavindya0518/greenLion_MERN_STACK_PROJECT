const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    // Linked application user (login credentials), optional until created
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Supplier business name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [120, "Name must be at most 120 characters"],
    },

    // Primary contact person
    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
      trim: true,
      minlength: [2, "Contact person must be at least 2 characters"],
      maxlength: [120, "Contact person must be at most 120 characters"],
    },

    // Contact email
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    // Contact phone
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      minlength: [5, "Phone must be at least 5 characters"],
      maxlength: [30, "Phone must be at most 30 characters"],
    },

    // Physical or mailing address
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [300, "Address must be at most 300 characters"],
    },

    // Category name (stored as string)
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    // Operational status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// hot-reload guard to avoid OverwriteModelError
module.exports =
  mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
