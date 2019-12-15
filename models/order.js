const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var deepPopulate = require("mongoose-deep-populate")(mongoose);

const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      qty: { type: Number, required: true }
    }
  ],
  user: {
    email: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  }
});
orderSchema.plugin(deepPopulate);
module.exports = mongoose.model("Order", orderSchema);
