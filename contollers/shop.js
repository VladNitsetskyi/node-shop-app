const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const ITEMS_PER_PAGE = 4;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(allProdsQty => {
      totalItems = allProdsQty;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })

    .then(result => {
      res.render("shop/product-list", {
        prods: result,
        pageTitle: "All Products",
        path: "/products",
        hasProducts: result.length > 0,
        pagination: {
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        }
      });
    })
    .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(prod => {
      res.render("shop/product-detail", {
        product: prod,
        pageTitle: prod.title,
        path: "/products"
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(allProdsQty => {
      totalItems = allProdsQty;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })

    .then(result => {
      res.render("shop/index", {
        prods: result,
        pageTitle: "Shop",
        path: "/",
        hasProducts: result.length > 0,
        pagination: {
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        }
      });
    })
    .catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    req.user
      .populate("cart.items.productId")
      .execPopulate()
      .then(products => {
        products = products.cart.items;
        if (products) {
          res.render("shop/cart", {
            path: "/cart",
            pageTitle: "Your Cart",
            products: products
          });
        } else {
          res.render("shop/cart", {
            path: "/cart",
            pageTitle: "Your Cart",
            products: []
          });
        }
      });
  }
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect("/");
    });
};

exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteSingleFromCart(prodId).then(prods => {
    res.redirect("/cart");
  });
};

exports.getCheckoutSuccess = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    req.user
      .populate("cart.items.productId")
      .execPopulate()
      .then(products => {
        products = products.cart.items.map(i => {
          return { product: { ...i.productId._doc }, qty: i.qty };
        });

        const order = new Order({
          user: {
            email: req.user.email,
            userId: req.user._id
          },
          products: products
        });
        return order.save();
      })
      .then(() => {
        return req.user.deleteAllFromCart();
      })
      .then(() => {
        res.redirect("/orders");
      });
  }
};

exports.getOrders = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    Order.find({ "user.userId": req.user._id }).then(orders => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders
      });
    });
  }
};

exports.getCheckout = (req, res, next) => {
  let total = 0;
  let products;
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(prods => {
      products = prods.cart.items;

      products.forEach(el => {
        total += el.qty * el.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: "usd",
            quantity: p.qty
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel"
      });
    })
    .then(session => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    });
};

//Creating a PDF file
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId).then(result => {
    if (!result) {
      return next();
    }
    if (result.user.userId.toString() === req.user._id.toString()) {
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      res.setHeader("Content-type", "application/pdf");
      res.setHeader("Content-disposition", "inline; filename=" + invoiceName);
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true
      });
      pdfDoc.moveDown();
      let totalPrice = 0;
      result.products.forEach(prod => {
        totalPrice += prod.qty * prod.product.price;
        pdfDoc
          .fontSize(18)
          .text(
            " - " +
              prod.product.title +
              ": x" +
              prod.qty +
              " (" +
              prod.product.price +
              "$ per item)"
          );
      });
      pdfDoc.moveDown();
      pdfDoc.fontSize(22).text("Total price: " + totalPrice + "$", {
        underline: true
      });
      pdfDoc.end();
    } else {
      res.redirect("/");
    }
  });
};
