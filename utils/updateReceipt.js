// utils/updateReceipt.js
const Receipt = require("../models/receiptModel");
const User = require("../models/User");
const Purchase = require("../models/purchaseModel");

async function updateReceipt(supplierId) {
  try {
    // Find the supplier by ID
    const supplier = await User.findById(supplierId);
    if (!supplier) {
      console.warn("⚠️ updateReceipt: Supplier not found for ID:", supplierId);
      return; // Stop here safely
    }

    // Get all purchases by this supplier
    const purchases = await Purchase.find({ supplierId });
    const totalOrders = purchases.length;
    const totalCylinders = purchases.reduce((sum, p) => sum + (p.cylinders || 0), 0);

    // Create or update receipt
    let receipt = await Receipt.findOne({ supplierId });

    if (!receipt) {
      receipt = new Receipt({
        supplierId,
        supplierName: supplier.name, // ← safe now
        totalOrders,
        totalCylinders,
      });
    } else {
      receipt.supplierName = supplier.name;
      receipt.totalOrders = totalOrders;
      receipt.totalCylinders = totalCylinders;
      receipt.updatedAt = new Date();
    }

    await receipt.save();
    console.log(`Receipt updated for supplier: ${supplier.name}`);
  } catch (err) {
    console.error("Error updating receipt:", err);
  }
}

module.exports = updateReceipt;
