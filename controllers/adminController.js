const User = require('../models/User');

exports.getSuppliers = async (req, res) => {
  const suppliers = await User.find({ role: 'supplier' });
  res.json(suppliers);
  
};

exports.getSupplierDetails = async (req, res) => {
  const supplier = await User.findById(req.params.id);
  res.json(supplier);
};
