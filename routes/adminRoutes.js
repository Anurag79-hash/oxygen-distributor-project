const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/authMiddleware");
const bcrypt=require("bcrypt");
const User = require("../models/User");
const Supplier = require("../models/User");
const Purchase = require("../models/purchaseModel");
const Receipt = require("../models/receiptModel");
const updateReceipt = require("../utils/updateReceipt");


router.get("/api/suppliers", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const query = {
      role: "supplier",
      name: { $regex: search, $options: "i" }
    };

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    res.json({
      suppliers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).json({ message: err.message });
  }
});


router.get("/api/purchases", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = { supplierName: { $regex: search, $options: "i" } };

    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      purchases,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error("Error in /admin/api/purchases:", err);
    res.status(500).json({ message: err.message });
  }
});


router.post("/purchase/send/:id", isAdmin, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        adminStatus: "sent",
        adminConfirmedAt: new Date()
      },
      { new: true }
    );

    if (purchase) {
      await updateReceipt(purchase.supplierId);
    }

    res.json({ message: "Order marked as sent" });
  } catch (err) {
    console.error("Error marking order as sent:", err);
    res.status(500).json({ message: "Error updating order" });
  }
});

router.get("/api/receipts", isAdmin, async (req, res) => {
  try {
    const receipts = await Receipt.find().populate("supplierId", "name email");
    res.json(receipts);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/supplierDetail", isAdmin, (req, res) => {
  res.render("supplierDetail"); // This renders the EJS file you already have
});
router.get("/supplierUpdates",isAdmin,(req,res)=>{
  res.render("adminSuppliers");
})

router.get("/api/supplierDetail/:id", isAdmin, async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplier = await User.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const purchases = await Purchase.find({ supplierId }).sort({ createdAt: -1 });
    const receipt = await Receipt.findOne({ supplierId });
    // console.log("total count ",receipt.totalCylindersPurchased);
    res.json({ supplier, purchases, receipt });
  } catch (err) {
    console.error("Error loading supplier details:", err);
    res.status(500).json({ message: "Server Error!" });
  }
});


router.get("/supplierDetail/:id", isAdmin, async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplier = await User.findById(supplierId);
    if (!supplier) return res.status(404).send("Supplier not found");

    const receipt = await Receipt.findOne({ supplierId });
    const purchases = await Purchase.find({ supplierId }).sort({ createdAt: -1 });

    // res.render("supplierDetail", { supplier, receipt, purchases });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading supplier details");
  }
});

  router.put('/api/updateSupplier/:id', async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    const updateData = { name, email, phone, address };

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    await Supplier.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating supplier' });
  }
});

// ✅ Delete supplier
router.delete('/api/deleteSupplier/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting supplier' });
  }
}); 

module.exports = router;
