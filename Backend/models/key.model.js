const mongoose = require("mongoose");

const keySchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true
    },
    keyValue:{
        type: String,
        required: true,
        unique: true
    }
});

keySchema.index({roleName:1, keyValue: 1})

const keyModel = new mongoose.model("Access_Key", keySchema);

module.exports = keyModel

