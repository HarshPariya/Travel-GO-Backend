import { Router } from "express";
import passport from "passport";
import {
  login,
  me,
  register,
  validateLogin,
  validateRegister,
  googleCallback,
  getProfile,
  updateProfile,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// ✅ Google OAuth routes (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: process.env.FRONTEND_URL || process.env.CLIENT_BASE_URL || "http://localhost:3000/login",
    }),
    googleCallback
  );
} else {
  console.warn('⚠️ Skipping Google OAuth routes: credentials not set');
}

// Protected routes
router.get("/me", requireAuth, me);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/wishlist/:tourId", requireAuth, addToWishlist);
router.delete("/wishlist/:tourId", requireAuth, removeFromWishlist);

export default router;
