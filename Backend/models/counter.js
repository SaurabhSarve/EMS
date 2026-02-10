const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  seq: { type: Number, default: 2024 }
});

module.exports = mongoose.model("Counter", counterSchema);
