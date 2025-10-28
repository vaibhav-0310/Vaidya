import express from 'express';
import Essential from '../schema/essentail.schema.js';
import Cart from '../schema/cart.schema.js';
import  {isLoggedIn} from '../middleware/middleware.js';

const router = express.Router();

router.get('/essentials', async (req, res) => {
  try {
    const essentials = await Essential.find();
    res.status(200).json(essentials);
  } catch (error) {
    console.error('Error fetching essentials:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/cart",isLoggedIn,async (req,res)=>{
     let{title, image, price, type} = req.body;
     let userId=req.user._id;
      try {
          const newCart = new Cart({
              userId,
              title,
              image,
              price,
              type
          });
          await newCart.save();
          res.status(201).json({ message: 'Item added to cart successfully' });
      } catch (error) {
          res.status(500).json({ message: 'Internal server error' });
      }
});

router.get("/cart",isLoggedIn,async (req,res)=>{
     let userId=req.user._id;
     try {
         const cartItems = await Cart.find({ userId });
         res.status(200).json(cartItems);
     } catch (error) {
         console.error('Error fetching cart items:', error);
         res.status(500).json({ message: 'Internal server error' });
     }
});


router.get("/items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Essential.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;