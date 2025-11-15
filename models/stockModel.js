const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  gasType: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model("Stock", stockSchema);
