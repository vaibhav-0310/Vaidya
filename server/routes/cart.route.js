import express from 'express';
import Cart from '../schema/cart.schema.js';

const router = express.Router();

router.delete('/cart/:id', async (req, res) => {
    try {
        const cartId = req.params.id;
        const deletedCart = await Cart.findByIdAndDelete(cartId);
        
        if (!deletedCart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        res.status(200).json({ message: 'Cart deleted successfully', cart: deletedCart });
    } catch (error) {
        console.error('Error deleting cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;