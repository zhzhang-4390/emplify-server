const express = require("express");
const _ = require("lodash");

const authorization = require("../middlewares/authorization");
const isAdmin = require("../middlewares/isAdmin");
const Request = require("../models/request");

const router = express.Router();

router.get("/getAllRequests", [authorization, isAdmin], (req, res) => {
  Request.find().exec((err, requests) => {
    res.send(requests);
  });
});

router.post("/addRequest", (req, res, next) => {
  const request = new Request(
    _.pick(req.body, [
      "company",
      "name",
      "email",
      "contactNumber",
      "requirement",
      "role",
    ])
  );

  request
    .save()
    .then(() => res.sendStatus(201))
    .catch(next);
});

module.exports = router;
