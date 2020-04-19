const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const loginSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  time: {
    type: Date,
    required: true,
  },
});

const Login = mongoose.model("Login", loginSchema);
module.exports = Login;
