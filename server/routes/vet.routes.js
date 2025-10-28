import express from 'express';
import Vet from '../schema/vet.schemas.js';

const router = express.Router();

router.get('/vet', async (req, res) => {
    try {
        const vets = await Vet.find();
        res.status(200).json(vets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/vet/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const vet = await Vet.findById(id);
        if (!vet) {
            return res.status(404).json({ message: 'Vet not found' });
        }
        res.status(200).json(vet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





export default router;