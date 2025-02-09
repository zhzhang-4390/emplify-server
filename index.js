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

// Middlewares
app.use(express.json());
app.use(cors());
app.use(
  session({
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000,
    },
  })
);

// APIs
app.use("/userService", require("./services/userService"));
app.use("/productService", require("./services/productService"));
app.use("/requestService", require("./services/requestService"));

// Database
mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Emplify DB connected");
    }
  }
);

app.listen(port, () => console.log(`Emplify server listening on port ${port}`));
