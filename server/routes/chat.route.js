import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import Chat from '../schema/chat.schema.js';
import User from '../schema/user.schema.js';
import Vet from '../schema/vet.schemas.js';

const router = express.Router();

const API_KEY = process.env.GEMINI_API_KEY; 
if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    process.exit(1); 
}
const genAI = new GoogleGenerativeAI(API_KEY);

router.post('/gemini-chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 


        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        if(!text) {
            return res.status(500).json({ error: "Server down, try again later." });
        }
        res.json({ response: text }); 
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Failed to get response from AI." });
    }
});

// Create or get existing chat between user and vet
router.post('/chat/create', async (req, res) => {
    try {
        const { userId, vetId } = req.body;

        if (!userId || !vetId) {
            return res.status(400).json({ error: "User ID and Vet ID are required." });
        }

        // Verify user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(400).json({ error: "User not found." });
        }

        // Verify vet exists
        const vetExists = await Vet.findById(vetId);
        if (!vetExists) {
            return res.status(400).json({ error: "Vet not found." });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({ user: userId, vet: vetId })
            .populate('user', 'username email')
            .populate('vet', 'name image post');

        if (!chat) {
            // Create new chat
            chat = new Chat({
                user: userId,
                vet: vetId,
                messages: [],
                status: 'active'
            });
            await chat.save();
            
            // Populate the new chat
            chat = await Chat.findById(chat._id)
                .populate('user', 'username email')
                .populate('vet', 'name image post');
        }

        res.json(chat);
    } catch (error) {
        console.error("Error creating/getting chat:", error);
        res.status(500).json({ error: "Failed to create/get chat." });
    }
});
// Close a chat
router.patch('/chat/:chatId/close', async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findByIdAndUpdate(
            chatId,
            { status: 'closed' },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ error: "Chat not found." });
        }

        res.json({ message: "Chat closed successfully", chat });
    } catch (error) {
        console.error("Error closing chat:", error);
        res.status(500).json({ error: "Failed to close chat." });
    }
});

export default router;