import express from "express";
import User from "../schema/user.schema.js";
import passport from "passport";
import nodemailer from "nodemailer";

const router = express.Router();

const otpMap = new Map();

router.post("/send-otp", async (req, res) => {
  try {
    let email = req.body.email;
    if (!email) {
      const user = await User.findOne({ username: req.body.username });
      if (!user || !user.email) {
        return res.status(400).json({ message: "User not found or email missing" });
      }
      email = user.email;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpMap.set(email, { otp, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vbhargav0310@gmail.com",
        pass: "jhah rcml tdzi yydf", 
      },
    });

    await transporter.sendMail({
      from: '"PawVaidya" <vbhargav0310@gmail.com>',
      to: email,
      subject: "OTP for PawVaidya",
      text: `Your OTP is ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to send OTP" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, email, district, state, password, otp } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(403).json({ message: "Username already exists" });

    const otpRecord = otpMap.get(email);
    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const newUser = new User({ username, email, district, state });
    await User.register(newUser, password); 

      req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login after signup failed" });
      }
      otpMap.delete(email);
      res.status(200).json({ message: "User created and logged in successfully", user_id: newUser._id.toString() });
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "User creation failed" });
  }
});



router.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Incorrect Password or Username" });

    const otp = req.body.otp;
    const email = user.email;

    const otpRecord = otpMap.get(email);
    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: err.message });

      otpMap.delete(email);
      return res.json({
        message: "Login successful",
        userId: user._id.toString(),
      });
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });

    req.session.destroy(() => {
      res.clearCookie("connect.sid"); 
      return res.json({ message: "Logout successful" });
    });
  });
});

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));


router.get(
  "/auth/google/callback",
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login',
    session: true, 
  }),
  async (req, res) => {
    try {
      const googleProfile = req.user;
      const username = googleProfile.displayName;
      const email = googleProfile.emails[0].value;

      let user = await User.findOne({ email });
      if (!user) {  
        user = new User({
          username,
          email,
          cart: [], 
        });
        await user.save();
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect('http://localhost:3000/login');
        }
        res.redirect('http://localhost:3000/');
      });
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect('http://localhost:3000/login');
    }
  }
);

export default router;
