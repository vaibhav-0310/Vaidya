import express from 'express';
import mongoose from 'mongoose';
import Blogs from '../schema/blogs.schema.js';
import blog from './blog.js'; 
import dotenv from 'dotenv';
dotenv.config();

const app=express();

const connect = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/pawvaidya");
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};
const pushEssentials = async (essentialsArray) => {
  try {
    await Blogs.deleteMany({}); 
    await Blogs.insertMany(essentialsArray);
    console.log("All essential items saved successfully");
  } catch (error) {
    console.error("Error saving essential items:", error);
  }
};

connect()
  .then(() => pushEssentials(blog))
  .catch((err) => {
    console.error("Failed to push essentials:", err);
  });
