const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
}

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(
  session({
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    name: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
  })
);
app.use("/userService", require("./services/userService"));
app.use("/productService", require("./services/productService"));
app.use("/requestService", require("./services/requestService"));

app.listen(port, () => console.log(`Emplify server listening on port ${port}`));

mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
  err => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Emplify DB connected");
    }
  }
);
