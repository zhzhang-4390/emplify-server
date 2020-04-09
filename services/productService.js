const express = require("express");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const aws = require("aws-sdk");

const authorization = require("../middlewares/authorization");
const isAdmin = require("../middlewares/isAdmin");
const Product = require("../models/product");

aws.config.update({ region: "ap-southeast-1" });
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_S3_ID,
  secretAccessKey: process.env.AWS_S3_KEY,
});
const CLOUD_URL = "https://emplify.s3-ap-southeast-1.amazonaws.com/";

const router = express.Router();

router.get("/getAllProductsForShelf", (req, res, next) => {
  Product.find({}, "name category description price frontImage").exec(
    (err, products) => {
      res.send(products);
    }
  );
});

router.get(
  "/getAllProductsForTable",
  [authorization, isAdmin],
  (req, res, next) => {
    Product.find({}, "name category location price owner createdAt updatedAt")
      .populate("owner", "email")
      .exec((err, products) => {
        res.send(products);
      });
  }
);

router.get("/getAllGroupedProducts", (req, res, next) => {
  Product.aggregate([
    {
      $group: {
        _id: "$category",
        productsByCategory: {
          $push: {
            name: "$name",
            description: "$description",
            price: "$price",
            frontImage: "$frontImage",
          },
        },
      },
    },
  ]).exec((err, products) => {
    res.send(products);
  });
});

router.get("/getMyProducts", authorization, (req, res, next) => {
  Product.find(
    { owner: req.session.user._id },
    "name description price frontImage"
  ).exec((err, products) => {
    res.send(products);
  });
});

router.get("/getProductByName", (req, res, next) => {
  Product.findOne({ name: req.query.name }).exec((err, product) => {
    res.send(product);
  });
});

router.post("/addOrUpdateProduct", authorization, async (req, res, next) => {
  if (req.session.user.role !== "seller" && req.session.user.role !== "admin") {
    return res.sendStatus(403);
  }

  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    let product =
      fields._id && fields._id !== "undefined"
        ? await Product.findById(fields._id)
        : new Product();

    _.merge(
      product,
      _.omit(fields, [
        "_id",
        "details",
        "frontImage",
        "images",
        "imagesToRemove",
      ]),
      {
        owner: req.session.user._id,
      }
    );

    product.details = [];
    JSON.parse(fields.details).forEach((detail) =>
      product.details.push(detail)
    );

    if (product.images.length !== 0) {
      JSON.parse(fields.imagesToRemove).forEach((image) =>
        product.images.pull(image)
      );
    }

    const promisesOfUploadToCloud = [];
    if (files.frontImage) {
      const frontImageCloudPath = `products/${product.name}/${files.frontImage.name}`;
      product.frontImage = CLOUD_URL + frontImageCloudPath;
      promisesOfUploadToCloud.push(
        uploadToCloud(files.frontImage.path, frontImageCloudPath)
      );
    }
    if (files.images) {
      files.images = [].concat(files.images);
      const imageCloudPaths = files.images.map(
        (image) => `products/${product.name}/images/${image.name}`
      );
      const imageCloudURLs = imageCloudPaths.map(
        (imageCloudPath) => CLOUD_URL + imageCloudPath
      );

      product.images = product.images.concat(imageCloudURLs);

      promisesOfUploadToCloud.concat(
        files.images.map((image, index) =>
          uploadToCloud(image.path, imageCloudPaths[index])
        )
      );
    }

    product
      .save()
      .then(() => {
        Promise.all(promisesOfUploadToCloud)
          .then(() => res.sendStatus(201))
          .catch(next);
      })
      .catch(next);
  });
});

function uploadToCloud(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: "emplify",
        Key: outputPath,
        Body: fs.createReadStream(inputPath),
        ACL: "public-read",
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

module.exports = router;
