const express = require("express");
const authController = require("../contollers/auth");
const router = express.Router();
const isAuth = require("../middleware/is-auth");

const { check } = require("express-validator");

router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    check(
      "password",
      "Please enter your password with only numbers and letters"
    )
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    check(
      "password",
      "Please enter your password with only numbers and letters , at least 5 charachters long"
    )
      .isLength({ min: 4, max: 16 })
      .isAlphanumeric()
      .trim(),
    check("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password confirmation does not match password");
        }
        return true;
      })
  ],
  authController.postSignup
);
router.get("/signup", authController.getSignup);

router.post("/logout", isAuth, authController.postLogout);

router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
