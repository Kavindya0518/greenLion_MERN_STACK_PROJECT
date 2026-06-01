// BACKEND/Controllers/production.controller.js
const mongoose = require("mongoose");
const RawMaterial = require("../Models/RawMaterial");
const FinishedProduct = require("../Models/FinishedProduct");
const StockTransaction = require("../Models/StockTransaction");

// Create a simple Production model on the fly if not present (optional)
// In case you already have a dedicated production model, replace usage below accordingly.
const Production = require("../Models/production.model");

exports.recordProduction = async (req, res) => {
  try {
    // Minimal record creation; assumes a Production model exists
    const doc = await Production.create({ ...(req.body || {}) });
    res.status(201).json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to record production" });
  }
};

exports.getAllProductions = async (req, res) => {
  try {
    const items = await Production.find().sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to get productions" });
  }
};

exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Production.findByIdAndUpdate(id, { ...(req.body || {}) }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Production not found" });
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update production" });
  }
};

exports.deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Production.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Production not found" });
    res.json({ success: true, message: "Production deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete production" });
  }
};

exports.getProductionSummary = async (req, res) => {
  try {
    // Very simple summary: counts
    const total = await Production.countDocuments();
    res.json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to get summary" });
  }
};
