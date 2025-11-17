const express = require("express");
const router = express.Router();
const { isSupplier } = require("../middleware/authMiddleware");
const Purchase = require("../models/purchaseModel");
const Receipt = require("../models/receiptModel");
const { v4: uuidv4 } = require("uuid");
const Stock = require("../models/stockModel");

// ✅ Supplier dashboard (renders the HTML page)
router.get("/dashboard", isSupplier, (req, res) => {
  res.render("supplierDashboard", { currUser: req.session.user });
});

// ✅ Submit new purchase (called by fetch POST)
router.post("/purchase", isSupplier, async (req, res) => {
  try {
    const { cylinders,gasType,subcategory, challanNo } = req.body;
    const supplierId = req.session.user?.id;
    const supplierName = req.session.user?.name;
    
    if (!supplierId)
      return res.status(401).json({ message: "Supplier not logged in" });
     if (!cylinders || cylinders <= 0 || !gasType || !subcategory) {
      return res.status(400).json({ message: "Please provide all fields" });
    }
        const stock = await Stock.findOne({ gasType, subcategory });

    // 🔹 Step 2: Chzeck stock available
    if (!stock || stock.qty < cylinders) {
      return res.json({ 
        status: "fail",
        message: `${gasType} category ${subcategory} Not enough stock available!`
      });
    }

    // 🔹 Step 3: Reduce stock
    stock.qty -= cylinders;
    await stock.save();
      // challanNo = `CH-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

const newPurchase = new Purchase({
  orderId: "ORDER-" + uuidv4().split("-")[0].toUpperCase(),
  supplierId,
  supplierName,
  type: "purchase",
  gasType,
  subcategory,
  cylinders,
  blankCylindersReturned: 0,
  challanNo:challanNo,
  adminStatus: "pending",
  supplierStatus: "pending",
});

    await newPurchase.save();
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
    const { blankCylinders, gasType, subcategory, ecrNo } = req.body;
    const supplierId = req.session.user?.id;
    const supplierName = req.session.user?.name;

    if (!supplierId)
      return res.status(401).json({ message: "Supplier not logged in" });

    if (!blankCylinders || blankCylinders <= 0)
      return res.status(400).json({ message: "Enter valid cylinders" });

    const purchases = await Purchase.find({
      supplierId,
      gasType,
      subcategory,
      type: "purchase",
      supplierStatus: "confirmed"
    });

    const returns = await Purchase.find({
      supplierId,
      gasType,
      subcategory,
      type: "return"
    });

    let totalPurchasedCategory = purchases.reduce((sum, p) => sum + p.cylinders, 0);
    let totalReturnedCategory = returns.reduce((sum, r) => sum + r.blankCylindersReturned, 0);

    let maxReturnable = totalPurchasedCategory - totalReturnedCategory;
       if ( maxReturnable<=0 || blankCylinders<=0) {
      return res.json({
        success: false,
        message: `You can return blank cylinders for ${gasType} - ${subcategory}`
      });
    }
  else  if (blankCylinders > maxReturnable) {
      return res.json({
        success: false,
        message: `You can return only ${maxReturnable} blank cylinders for ${gasType} - ${subcategory}`
      });
    }

    // ------------------------------------------
    // Continue with return logic
    // ------------------------------------------
    const newReturn = new Purchase({
      orderId: "RETURN-" + uuidv4().split("-")[0].toUpperCase(),
      supplierId,
      supplierName,
      type: "return",
      gasType,
      subcategory,
      cylinders: 0,
      blankCylindersReturned: blankCylinders,
      ecrNo,
      adminStatus: "pending",
      supplierStatus: "sent",
    });

    await newReturn.save();

    // Update global totals (optional)
    let receipt = await Receipt.findOne({ supplierId });
    if (receipt) {
      receipt.totalCylindersReturned += Number(blankCylinders);
      receipt.currentCylinders -= Number(blankCylinders);
      receipt.lastUpdated = new Date();
      await receipt.save();
    }

    res.json({
      success: true,
      message: "Blank cylinders return submitted successfully"
    });

  } catch (err) {
    console.error(err);
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
router.get("/status", isSupplier, async (req, res) => {
  const purchases = await Purchase.find();
  const returns = await Receipt.find();

  // You can merge and calculate here (if needed)
});

module.exports = router;
