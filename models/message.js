const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Room",
  },
  from: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: Date,
    required: true,
  },
  read: {
    type: Boolean,
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
