const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Receipt = require("../models/receiptModel");
const User = require("../models/User");
const Purchase = require("../models/purchaseModel");
const mongoose = require("mongoose");

// ✅ Register Supplier
exports.registerSupplier = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const phoneRegex=/^[0-9]\d{9}$/;
    if(!phoneRegex.test(phone)){
      return res.render('register',{success:null,error:"Invalid phone Number"});
    }
    // Check if supplier already exists
    const existing = await User.findOne({ email });
    if (!name || !email || !password) {
      return res.render('register', { error: 'All fields are required', success: null });
    }
    if (existing) return res.render('register',{error:"Email already registered",success:null});

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);
    // Create new supplier
    const newSupplier = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "supplier",
    });

    await newSupplier.save();
    res.redirect("/login");
  } catch (err) {
        res.render('register', { error: 'Server error. Try again.', success: null });

  }
};

// ✅ Login Supplier
exports.loginSupplier = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('login', { error: 'Invalid email', success: null });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render('login',{error:"Invalid Password",Success:null});

    req.session.user = {
      id: user._id,
      name: user.name,
      role: user.role,
    };

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/supplier/dashboard");
    }
  } catch (error) {
    res.render('login', { error: 'Server error. Try again.', success: null });

  }
};

// ✅ Logout
exports.logout =async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout Failed");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};
