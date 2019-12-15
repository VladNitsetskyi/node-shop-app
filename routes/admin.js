const express = require("express");
const router = express.Router();
const adminController = require("../contollers/admin");
const isAuth = require("../middleware/is-auth");
const { check } = require("express-validator");

router.get("/add-product", isAuth, adminController.getAddProduct);
router.post(
  "/add-product",
  isAuth,
  [
    check("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Please enter a valid title"),
    check("price")
      .isFloat()
      .withMessage(
        "Please enter a valid price with numbers only, floating is accepted as well"
      ),
    check("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage(
        "Please enter a valid description with length min 5 characters"
      )
  ],
  adminController.postAddProduct
);

router.get("/products", adminController.getProducts);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);
router.post(
  "/edit-product",
  isAuth,
  [
    check("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Please enter a valid title"),
    check("price")
      .isFloat()
      .withMessage(
        "Please enter a valid price with numbers only, floating is accepted as well"
      ),
    check("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage(
        "Please enter a valid description with length min 5 characters"
      )
  ],
  adminController.postEditProduct
);
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
