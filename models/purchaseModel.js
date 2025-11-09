const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const purchaseSchema = new mongoose.Schema({
  orderId: { type: String, default: () => uuidv4() },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true  },
  supplierName: String,
  cylinders: Number,
  blankCylindersReturned: { type: Number, default: 0 },
  adminStatus: { type: String, default: "pending" },
  supplierStatus: { type: String, default: "pending" },
  adminConfirmedAt: { type: Date, default: null },
  supplierConfirmedAt: { type: Date, default: null },
}, { timestamps: true }); // <-- automatically adds createdAt & updatedAt

module.exports = mongoose.model("Purchase", purchaseSchema);
