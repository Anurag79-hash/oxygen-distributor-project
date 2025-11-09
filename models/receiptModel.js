const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  supplierName: String,
  supplierEmail: String,
  totalCylindersPurchased: { type: Number, default: 0 },
  totalCylindersReturned: { type: Number, default: 0 },
  currentCylinders: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Receipt", receiptSchema);
