import express from "express";
import { isLoggedIn } from "../middleware/middleware.js";
const router= express.Router();

router.get('/auth-status', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ isAuthenticated: true, user: req.user });
  } else {
    return res.json({ isAuthenticated: false, user: null });
  }
});

router.get("/traffic", (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.send(`Your IP address is: ${clientIp}`);
});

router.get("/protected", isLoggedIn, (req, res) => {
  res.send("This is a protected route. You are logged in.");
});

export default router;
