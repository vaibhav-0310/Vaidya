import mongoose from "mongoose";

const vetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  post: { type: String, required: true },
});

const Vet = mongoose.model("Vet", vetSchema);

export default Vet;
