import { Schema } from "mongoose";
import mongoose from "mongoose";

const CartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required: true,
    },
     title:{
    type: String,
    required: true
  },
    image: {
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true  
    },
    type: {
        type: String,
        required: true
    }
    });

const Cart= mongoose.model('Cart', CartSchema);
export default Cart;