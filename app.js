const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const User = require("./models/user");
const helmet = require("helmet");
const compression = require("compression");
//Route import
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
//Controllers import
const pagenotfoudController = require("./contollers/404");

const app = express();
const mongoose = require("mongoose");
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster-roa0v.mongodb.net/${process.env.MONGO_DEFAULT_DB}?retryWrites=true&w=majority`;

app.set("view engine", "ejs");
app.set("views", "views");

// for Request body parsing
app.use(helmet());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].indexOf(file.mimetype) >= 0) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/public/images",
  express.static(path.join(__dirname, "public/images"))
);

const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions"
});
app.use(
  session({
    secret: "qRIGYHeMiAYZF9Aq",
    resave: true,
    saveUninitialized: false,
    store: store
  })
);

const csrfProtection = csrf();
app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
  return !req.session.user
    ? next()
    : User.findById(req.session.user._id).then(user => {
        req.user = user;
        next();
      });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//Routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(pagenotfoudController.Page404);

mongoose.connect(MONGODB_URI).then(() => {
  app.listen(process.env.PORT || 3000);
});
