// BACKEND/Models/payment.model.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // human-friendly id
    paymentNumber: {
      type: String,
      unique: true,
      default: () => `PAY${Date.now()}`
    },

    // relations
    orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },

    // money
    amount: { type: Number, required: true, min: 0 },

    // type & status
    paymentType: {
      type: String,
      enum: ["offline", "cod", "card"],
      default: "offline"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending"
    },

    // offline details (bank slip, note…)
    offlinePayment: {
      bankSlipImage: { type: String },  // path/url
      customerNote:  { type: String }
    },

    // audit trail
    statusHistory: [
      {
        status:    { type: String, required: true },
        note:      { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now }
      }
    ],

    // admin actions block used by your controller
    adminActions: {
      reviewedAt:       { type: Date },
      approvedAt:       { type: Date },
      rejectionReason:  { type: String },
      notes: [
        {
          note:      { type: String },
          addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: { type: Date, default: Date.now }
        }
      ]
    }
  },
  { timestamps: true }
);

// methods used by controller
paymentSchema.methods.updateStatus = function (newStatus, userId, note) {
  this.status = newStatus;
  if (newStatus === "confirmed") {
    this.adminActions.approvedAt = new Date();
    this.adminActions.rejectionReason = undefined;
  }
  if (newStatus === "rejected") {
    this.adminActions.approvedAt = undefined;
  }
  this.statusHistory.push({
    status: newStatus,
    note: note || `Payment marked as ${newStatus}`,
    updatedBy: userId
  });
  if (newStatus !== "pending") this.adminActions.reviewedAt = new Date();
};

paymentSchema.methods.addAdminNote = function (note, userId) {
  if (!this.adminActions) this.adminActions = {};
  if (!this.adminActions.notes) this.adminActions.notes = [];
  this.adminActions.notes.push({ note, addedBy: userId });
};

// nicer incremental-ish number if you prefer
paymentSchema.pre("save", async function (next) {
  if (this.isNew && !this.paymentNumber) {
    try {
      const last = await this.constructor.findOne().sort({ createdAt: -1 });
      const lastNum = last?.paymentNumber?.replace?.("PAY", "");
      const n = Number(lastNum);
      this.paymentNumber = Number.isFinite(n) ? `PAY${n + 1}` : `PAY${Date.now()}`;
    } catch {
      this.paymentNumber = `PAY${Date.now()}`;
    }
  }
  next();
});

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1, paymentType: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
