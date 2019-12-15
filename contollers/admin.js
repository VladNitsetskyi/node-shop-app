const Product = require("../models/product");
const { validationResult } = require("express-validator");
const fileHelper = require("../utility/file");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;
  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        description: description,
        price: price
      },
      errorMessage: "Attached file is not an image",
      validationErrors: []
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        description: description,
        price: price
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: "/" + imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(() => res.redirect("/"))
    .catch(err => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit === "true" ? true : false;
  const prodId = req.params.productId;

  Product.findById(prodId).then(product => {
    if (!product) {
      return res.redirect("/");
    }
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      product: product,
      editing: editMode,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
  });
};

exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        _id: req.body.id
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findById(req.body.id).then(product => {
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect("/");
    }
    let updatedProduct = {
      title: req.body.title,
      price: req.body.price,
      description: req.body.description
    };
    if (req.file) {
      fileHelper.deleteFile(product.imageUrl);
      updatedProduct.imageUrl = "/" + req.file.path;
    }
    return Product.findByIdAndUpdate(req.body.id, updatedProduct)
      .then(() => {
        res.redirect("/admin/products");
      })
      .catch(err => console.log(err));
  });
};

exports.deleteProduct = (req, res, next) => {
  Product.findOne({ _id: req.params.productId, userId: req.user._id })
    .then(prod => {
      fileHelper.deleteFile(prod.imageUrl);
      return Product.findOneAndDelete({
        _id: req.params.productId,
        userId: req.user._id
      });
    })
    .then(() => {
      res.status(200).json({ message: "successfully deleted" });
    })
    .catch(err => res.status(500).json({ message: "failed to delete" }));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        hasProducts: products.length > 0
      });
    })
    .catch(err => console.log(err));
};
