const express = require("express");
const _ = require("lodash");
const bcrypt = require("bcrypt");

const authorization = require("../middlewares/authorization");
const User = require("../models/user");

const router = express.Router();

router.get("/getAllUsers", (req, res) => {
  User.find({}, "email role createdAt updatedAt").exec((err, users) => {
    res.send(users);
  });
});

router.post("/signIn", async (req, res, next) => {
  const user = new User(_.pick(req.body, ["email", "password"]));

  const existingUser = await User.findOne({ email: user.email });
  if (!existingUser) {
    return res.sendStatus(404);
  }

  const matched = await bcrypt.compare(user.password, existingUser.password);
  if (matched) {
    req.session.user = _.pick(existingUser, ["_id", "role"]);
    res.send({
      email: existingUser.email,
      role: existingUser.role,
      shoppingCartSize: existingUser.shoppingCart.length
    });
  } else {
    res.sendStatus(401);
  }
});

router.post("/signOut", (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie(process.env.SESSION_NAME);
    res.send();
  });
});

router.post("/signUp", async (req, res, next) => {
  const user = new User(_.pick(req.body, ["email", "password", "role"]));

  const existingUser = await User.findOne({ email: user.email });
  if (existingUser) {
    return res.sendStatus(409);
  }

  user.password = await bcrypt.hash(user.password, 10);
  user
    .save()
    .then(() => res.sendStatus(201))
    .catch(next);
});

router.get("/getFavourites", authorization, (req, res, next) => {
  User.findById(req.session.user._id)
    .populate("favourites", "name description price frontImage")
    .exec((err, user) => res.send(user.favourites));
});

router.get("/isFavourite", authorization, (req, res, next) => {
  User.findById(req.session.user._id).exec((err, user) =>
    res.send(user.favourites.includes(req.query._id))
  );
});

router.post("/addFavourite", authorization, async (req, res, next) => {
  const user = await User.findById(req.session.user._id);
  user.favourites.push(req.body._id);
  user
    .save()
    .then(() => res.sendStatus(201))
    .catch(next);
});

router.post("/removeFavourite", authorization, async (req, res, next) => {
  const user = await User.findById(req.session.user._id);
  user.favourites = user.favourites.filter(_id => !_id.equals(req.body._id));
  user
    .save()
    .then(() => res.sendStatus(200))
    .catch(next);
});

router.get("/getShoppingCart", authorization, (req, res, next) => {
  User.findById(req.session.user._id)
    .populate("shoppingCart", "name description price frontImage")
    .exec((err, user) => res.send(user.shoppingCart));
});

router.get("/isInShoppingCart", authorization, (req, res, next) => {
  User.findById(req.session.user._id).exec((err, user) =>
    res.send(user.shoppingCart.includes(req.query._id))
  );
});

router.post("/addToShoppingCart", authorization, async (req, res, next) => {
  const user = await User.findById(req.session.user._id);
  user.shoppingCart.push(req.body._id);
  user
    .save()
    .then(() =>
      res.status(201).send({ shoppingCartSize: user.shoppingCart.length })
    )
    .catch(next);
});

router.post(
  "/removeFromShoppingCart",
  authorization,
  async (req, res, next) => {
    const user = await User.findById(req.session.user._id);
    user.shoppingCart = user.shoppingCart.filter(
      _id => !_id.equals(req.body._id)
    );
    user
      .save()
      .then(() =>
        res.status(200).send({ shoppingCartSize: user.shoppingCart.length })
      )
      .catch(next);
  }
);

module.exports = router;
