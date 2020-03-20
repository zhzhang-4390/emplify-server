const express = require("express");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const { Storage } = require("@google-cloud/storage");

const authorization = require("../middlewares/authorization");
const Product = require("../models/product");

const router = express.Router();
const storage = new Storage({
  keyFilename: `${path.resolve(__dirname)}/../Emplify-befcf9647dd2.json`,
  projectId: "emplify"
});
const storageURL = "https://storage.cloud.google.com/emplify/";

router.get("/getAllProductsForShelf", (req, res, next) => {
  Product.find({}, "name category description price frontImage").exec(
    (err, products) => {
      res.send(products);
    }
  );
});

router.get("/getAllProductsForTable", (req, res, next) => {
  Product.find({}, "name category location price owner createdAt updatedAt")
    .populate("owner", "email")
    .exec((err, products) => {
      res.send(products);
    });
});

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
            frontImage: "$frontImage"
          }
        }
      }
    }
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
        "imagesToRemove"
      ]),
      {
        owner: req.session.user._id
      }
    );

    product.details = [];
    JSON.parse(fields.details).forEach(detail => product.details.push(detail));

    if (product.images.length !== 0) {
      JSON.parse(fields.imagesToRemove).forEach(image =>
        product.images.pull(image)
      );
    }

    const promisesOfUploadToGCS = [];
    if (files.frontImage) {
      const frontImageGCSPath = `products/${product.name}/${files.frontImage.name}`;
      product.frontImage = storageURL + frontImageGCSPath;
      promisesOfUploadToGCS.push(
        uploadToGCS(files.frontImage.path, frontImageGCSPath)
      );
    }
    if (files.images) {
      files.images = [].concat(files.images);
      const imageGCSPaths = files.images.map(
        image => `products/${product.name}/images/${image.name}`
      );
      const imageGCSURLs = imageGCSPaths.map(
        imageStoragePath => storageURL + imageStoragePath
      );

      product.images = product.images.concat(imageGCSURLs);

      promisesOfUploadToGCS.concat(
        files.images.map((image, index) =>
          uploadToGCS(image.path, imageGCSPaths[index])
        )
      );
    }

    product
      .save()
      .then(() => {
        Promise.all(promisesOfUploadToGCS)
          .then(() => res.sendStatus(201))
          .catch(next);
      })
      .catch(next);
  });
});

function uploadToGCS(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const GCSFile = storage.bucket("emplify").file(outputPath);
    fs.createReadStream(inputPath)
      .pipe(
        GCSFile.createWriteStream({
          resumable: false,
          gzip: true
        })
      )
      .on("finish", () => resolve())
      .on("error", err => reject(err));
  });
}

module.exports = router;
