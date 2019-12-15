const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const deepPopulate = require("mongoose-deep-populate")(mongoose);

const userSchema = new Schema({
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Product"
        },
        qty: { type: Number, required: true }
      }
    ]
  }
});

userSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cartprod => {
    return cartprod.productId.toString() == product._id.toString();
  });
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    updatedCartItems[cartProductIndex].qty += 1;
  } else {
    updatedCartItems.push({
      productId: product._id,
      qty: 1
    });
  }
  const UpdatedCart = {
    items: updatedCartItems
  };
  this.cart = UpdatedCart;

  return this.save();
};

userSchema.methods.deleteSingleFromCart = function(prodId) {
  const updatedCartItems = this.cart.items.filter(cartprod => {
    return cartprod.productId.toString() !== prodId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.deleteAllFromCart = function() {
  this.cart.items = [];
  return this.save();
};

userSchema.plugin(deepPopulate);
module.exports = mongoose.model("User", userSchema);
