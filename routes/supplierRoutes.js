const express = require("express");
const router = express.Router();
const { isSupplier } = require("../middleware/authMiddleware");
const Purchase = require("../models/purchaseModel");
const Receipt = require("../models/receiptModel");

// ✅ Supplier dashboard (renders the HTML page)
router.get("/dashboard", isSupplier, (req, res) => {
  res.render("supplierDashboard", { currUser: req.session.user });
});

// ✅ Submit new purchase (called by fetch POST)
router.post("/purchase", isSupplier, async (req, res) => {
  try {
    const { cylinders } = req.body;
    const supplierId = req.session.user?.id;
    const supplierName = req.session.user?.name;

    if (!supplierId)
      return res.status(401).json({ message: "Supplier not logged in" });

    const newPurchase = new Purchase({
      supplierId,
      supplierName,
      cylinders,
      blankCylindersReturned: 0,
      adminStatus: "pending",
      supplierStatus: "pending",
    });

    await newPurchase.save();

    console.log("Purchase created:", newPurchase);
    res.json({ success: true, message: "Purchase created successfully" });
  } catch (err) {
    console.error("Error submitting purchase:", err);
    res.status(500).json({ message: "Error submitting purchase" });
  }
});

// ✅ Get all purchases for this supplier
router.get("/myOrders", isSupplier, async (req, res) => {
  try {
    const supplierId = req.session.user?.id;
    const orders = await Purchase.find({ supplierId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Return blank cylinders (without new purchase)
router.post("/return", isSupplier, async (req, res) => {
  try {
    const { blankCylinders } = req.body;
    const supplierId = req.session.user?.id;
    const supplierName = req.session.user?.name;

    if (!supplierId) {
      return res.status(401).json({ message: "Supplier not logged in" });
    }

    if (!blankCylinders || blankCylinders <= 0) {
      return res.status(400).json({ message: "Enter a valid number of cylinders" });
    }

    // Create a record in Purchase for the return (so admin can track)
    const newReturn = new Purchase({
      supplierId,
      supplierName,
      cylinders: 0, // No new purchase
      blankCylindersReturned: blankCylinders,
      adminStatus: "return_requested",
      supplierStatus: "sent",
    });

    await newReturn.save();

    // ✅ Update supplier receipt
    const receipt = await Receipt.findOne({ supplierId });
    if (receipt) {
      receipt.totalCylindersReturned += Number(blankCylinders);
      receipt.currentCylinders -= Number(blankCylinders);
      receipt.lastUpdated = new Date();
      await receipt.save();
    } else {
      await Receipt.create({
        supplierId,
        supplierName,
        totalCylindersPurchased: 0,
        totalCylindersReturned: Number(blankCylinders),
        currentCylinders: 0 - Number(blankCylinders),
      });
    }

    res.json({ success: true, message: "Blank cylinders return submitted successfully" });
  } catch (err) {
    console.error("❌ Error processing return:", err);
    res.status(500).json({ message: "Server error while returning cylinders" });
  }
});


// Confirm received cylinders (supplier side)
router.post("/confirm/:id", isSupplier, async (req, res) => {
  try {
    const { id } = req.params;
    const { blankCylindersReturned } = req.body;
    const supplierId = req.session.user?.id;
    const purchase = await Purchase.findById(id);
    if (!purchase)
      return res.status(404).json({ message: "Order not found" });
    cylinders=purchase.cylinders;
    // update supplier confirmation
    purchase.supplierStatus = "confirmed";
    purchase.blankCylindersReturned = blankCylindersReturned;
    purchase.supplierConfirmedAt = new Date();
    blankCylRe=Number(purchase.blankCylindersReturned);
    await purchase.save();
      const receipt = await Receipt.findOne({ supplierId });
    if (receipt) {
      receipt.totalCylindersPurchased += Number(cylinders);
      receipt.currentCylinders += Number(cylinders)-blankCylRe;
      receipt.lastUpdated = new Date();
      receipt.totalCylindersReturned+=blankCylRe;
      await receipt.save();
    } else {
      await Receipt.create({
        supplierId,
        supplierName,
        supplierEmail,
        totalCylindersPurchased: Number(cylinders),
        totalCylindersReturned: 0,
        currentCylinders: Number(cylinders),
      });
    }
    res.json({ success: true, message: "Order confirmed successfully" });
  } catch (err) {
    console.error("❌ Error confirming order:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
