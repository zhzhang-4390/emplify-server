const mongoose = require("mongoose");

const Room = require("../models/room");
const User = require("../models/user");
const Message = require("../models/message");

module.exports = function (socket) {
  socket.on("signin", (data) => {
    Room.aggregate([
      { $match: { users: mongoose.Types.ObjectId(data.user) } },
      {
        $lookup: {
          from: Message.collection.name,
          localField: "_id",
          foreignField: "room",
          as: Message.collection.name,
        },
      },
    ]).exec(async (err, rooms) => {
      for (const room of rooms) {
        if (!room.name) {
          const counterpart = room.users.find(
            (user) => !user.equals(data.user)
          );
          const user = await User.findById(counterpart);
          room.name = user.name;
        }
      }
      socket.emit("load", rooms);

      rooms.forEach((room) => socket.join(room._id));
      socket.join(data.user);
    });
  });

  socket.on("contact", async (data) => {
    const room = new Room({
      name: null,
      isPrivate: true,
      users: [data.from, data.to],
    });
    room.save();

    const userFrom = await User.findById(data.from);
    const userTo = await User.findById(data.to);
    socket.emit("contact", {
      _id: room._id,
      isPrivate: room.isPrivate,
      name: userTo.name,
      users: room.users,
      messages: [],
    });
    socket.to(data.to).emit("contact", {
      _id: room._id,
      isPrivate: room.isPrivate,
      name: userFrom.name,
      users: room.users,
      messages: [],
    });
  });

  socket.on("join", (data) => {
    socket.join(data._id);
  });

  socket.on("message", (data) => {
    socket.emit("message", data);
    socket.to(data.room).emit("message", data);

    const message = new Message(data);
    message.save();
  });
};
