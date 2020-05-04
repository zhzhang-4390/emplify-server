const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  isPrivate: {
    type: Boolean,
    required: true,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
