const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String },
  type: { type: String, enum: ["purchase", "return"], default: "purchase" },
  gasType: { type: String },              
  subcategory: { type: String },
  cylinders: { type: Number, default: 0 },
  blankCylindersReturned: { type: Number, default: 0 },
  challanNo: { type: String }, 
  ecrNo: { type: String }, 
  adminStatus: { type: String, default: "pending" },
  supplierStatus: { type: String, default: "pending" },
  supplierConfirmedAt: { type: Date },
  adminConfirmedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
