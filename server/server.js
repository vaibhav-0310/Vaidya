import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import cookieParser from "cookie-parser";
import "dotenv/config";
import User from "./schema/user.schema.js";
import userRoutes from "./routes/user.routes.js";
import mainRoutes from "./routes/main.routes.js";
import essentialRoutes from "./routes/essential.routes.js";
import phrRoutes from "./routes/phr.routes.js";
import blogroutes from "./routes/blog.route.js";
import blog from "./data/blog.js";
import payment from "./routes/payment.route.js";
import cart from "./routes/cart.route.js";
import chat from "./routes/chat.route.js";
import vet from "./routes/vet.routes.js";
import par from "./routes/parser.routes.js";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; 
import { createServer } from 'http';
import { Server } from 'socket.io';
import Chat from './schema/chat.schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pinecone } from '@pinecone-database/pinecone'

const app = express();
const port = process.env.PORT;
const server = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

//middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.urlencoded({ extended: true , limit: "50mb"}));
app.use(express.json({limit: "50mb"})); 
app.use(cookieParser());
// Trust proxy for correct client IP detection
app.set('trust proxy', true);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "random",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure:false,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8080/api/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      return done(null, profile);
    } catch (error) {
      return done(error, null);
    }
  }
));
passport.use(new Strategy(User.authenticate()));
passport.serializeUser((user, done) => {
  if (user.emails) {
    done(null, { type: 'google', email: user.emails[0].value });
  } else {
    done(null, { type: 'local', id: user._id });
  }
});

passport.deserializeUser(async (serializedUser, done) => {
  try {
    let user;
    if (serializedUser.type === 'google') {
      user = await User.findOne({ email: serializedUser.email });
    } else {
      user = await User.findById(serializedUser.id);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URL);
};

connect()
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

//pinecone 
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function setupPinecone() {
  const indexName = 'medical-documents';
  
  try {
    console.log('🔍 Checking for existing indexes...\n');
    
    // Check if index already exists
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      index => index.name === indexName
    );

    if (indexExists) {
      console.log(`✅ Index "${indexName}" already exists!`);
      console.log('📊 You can start using the API now.\n');
      return;
    }

    // Create new index
    console.log(`📝 Creating index "${indexName}"...\n`);
    
    await pinecone.createIndex({
      name: indexName,
      dimension: 3072, // text-embedding-3-large dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1' // Change based on your location
        }
      }
    });

    console.log('✅ Index created successfully!\n');
    console.log('⏳ Please wait 30-60 seconds for the index to initialize...\n');
    console.log('💡 Tip: Run test-pinecone.js to verify the setup\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ALREADY_EXISTS')) {
      console.log('✅ Index already exists, you can proceed!\n');
    } else if (error.message.includes('API key')) {
      console.log('💡 Tip: Check your PINECONE_API_KEY in .env file\n');
    }
  }
}

setupPinecone();

//routes
app.use("/api", userRoutes);
app.use("/api", mainRoutes);
app.use("/api", phrRoutes);
app.use("/api", essentialRoutes);
app.use("/api", blogroutes);
app.use("/api/paypal", payment);
app.use("/api", cart);
app.use("/api", chat);
app.use("/api", vet);
app.use("/api", par);

// Socket.IO connection handling
io.on('connection', (socket) => {
  

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { chatId, senderId, senderType, content } = data;
      
      // Find or create chat
      let chat = await Chat.findById(chatId);
      if (!chat) {
        return socket.emit('error', 'Chat not found');
      }

      // Add message to chat
      const newMessage = {
        sender: senderId,
        senderType: senderType,
        content: content,
        timestamp: new Date(),
        read: false
      };

      chat.messages.push(newMessage);
      chat.lastMessage = new Date();
      await chat.save();

      // Emit message to all users in the chat room
      io.to(chatId).emit('receive-message', {
        messageId: newMessage._id,
        sender: senderId,
        senderType: senderType,
        content: content,
        timestamp: newMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle message read status
  socket.on('mark-read', async (data) => {
    try {
      const { chatId, messageId } = data;
      
      await Chat.findOneAndUpdate(
        { _id: chatId, 'messages._id': messageId },
        { $set: { 'messages.$.read': true } }
      );

      socket.to(chatId).emit('message-read', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('disconnect', () => {
   
  });
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    app.get(/^\/(?!api).*/, (req, res) => {
      
      res.sendFile(indexPath);
    });
  }
}

server.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
