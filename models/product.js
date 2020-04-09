const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: Object,
    },
    price: {
      type: Number,
      required: true,
    },
    details: [
      {
        type: String,
        trim: true,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    frontImage: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
