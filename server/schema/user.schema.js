import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema= mongoose.Schema({
   username:{
    type:String,
    required:true,
    unique:true
   },
   state:{
    type:String,
   },
   district:{
    type:String,
   },
   email:{
    type:String,
    required:true,
    unique:true
   },
});

userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("user",userSchema);

export default User;