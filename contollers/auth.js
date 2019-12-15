const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "vlad.newaddress@gmail.com",
    pass: "Vlad4an455"
  }
});

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: req.flash("error")[0],
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  const email = req.body.email;
  const pass = req.body.password;

  if (!errors.isEmpty()) {
    res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: pass
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email }).then(user => {
    if (!user) {
      req.flash("error", "No user with such email");
      return res.render("auth/login", {
        pageTitle: "Login",
        path: "/login",
        errorMessage: req.flash("error")[0],
        oldInput: {
          email: email,
          password: pass
        },
        validationErrors: [{ param: "email" }]
      });
    }
    bcrypt.compare(pass, user.password).then(doMatch => {
      if (doMatch) {
        req.session.user = user;
        req.session.isLoggedIn = true;
        return req.session.save(() => {
          res.redirect("/");
        });
      }
      req.flash("error", "You entered incorrect password");
      return res.render("auth/login", {
        pageTitle: "Login",
        path: "/login",
        errorMessage: req.flash("error")[0],
        oldInput: {
          email: email,
          password: pass
        },
        validationErrors: [{ param: "password" }]
      });
    });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: req.flash("error")[0],
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const pass = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: pass,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email }).then(userDoc => {
    if (userDoc) {
      req.flash("error", "User with such email already exists");
      return res.render("auth/signup", {
        pageTitle: "Signup",
        path: "/signup",
        errorMessage: req.flash("error")[0],
        oldInput: {
          email: email,
          password: pass,
          confirmPassword: req.body.confirmPassword
        },
        validationErrors: [{ param: "email" }]
      });
    }
    return bcrypt
      .hash(pass, 12)
      .then(phash => {
        const user = new User({
          email: email,
          password: phash,
          cart: { items: [] }
        });
        return user.save();
      })
      .then(result => {
        transporter.sendMail({
          from: "Best_shop@shop.com",
          to: "vladislav220@gmail.com",
          subject: "Registration completed",
          text:
            "You have been successfully registered on our web site! You may now use your credentials to login!"
        });
        res.redirect("/login");
      });
  });
};

exports.getReset = (req, res, next) => {
  const message = req.flash("error")[0];
  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash("error", "No user with this email.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 1200000;
        return user.save();
      })
      .then(result => {
        res.redirect("/");
        transporter.sendMail({
          from: "Best_shop@shop.com",
          to: req.body.email,
          subject: "Reset Password",
          html: `
        <p> To reset your password follow the link below:</p>
        <br>
        >>>>>>>>>>>>>>>>>>>>>><a href="http://localhost:3000/reset/${token}">Reset Password Link</a><<<<<<<<<<<<<<<<<<<<<<<<
        <p> Link is valid for only 20 minutes</p>
        `
        });
      });
  });
};
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  }).then(user => {
    if (!user) {
      return res.redirect("/");
    }
    const message = req.flash("error")[0];
    res.render("auth/new-password", {
      pageTitle: "New Password",
      path: "/new-password",
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token
    });
  });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12).then(hashedPass => {
        resetUser.password = hashedPass;
        resetUser.resetToken = null;
        resetUser.resetTokenExpiration = null;
        return resetUser.save();
      });
    })
    .then(result => {
      req.flash("error", "Reset completed");
      res.redirect("/login");
    });
};
