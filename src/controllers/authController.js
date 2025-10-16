import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";

function signToken(userId) {
    if (!process.env.JWT_SECRET) {
        // Fallback to a temporary dev secret to avoid crashing in production,
        // but still emit a clear warning. Replace with process.env in real deployments.
        console.warn('⚠️ JWT_SECRET is not set. Using a temporary in-memory secret. Set JWT_SECRET in your environment.');
        const tempSecret = 'TEMP_DEV_ONLY_CHANGE_ME';
        return jwt.sign({ userId }, tempSecret, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        });
    }
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
}

export const validateRegister = [
	body("name").isString().isLength({ min: 2 }),
	body("email").isEmail(),
	body("password").isLength({ min: 6 }),
];

export async function register(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	const { name, email, password } = req.body;
	const existing = await User.findOne({ email });
	if (existing) return res.status(409).json({ message: "Email already in use" });

	const user = await User.create({ name, email, password });
	const token = signToken(user._id);
	res.status(201).json({
		user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
		token,
	});
}

export const validateLogin = [
	body("email").isEmail(),
	body("password").isString().notEmpty(),
];

export async function login(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

	const { email, password } = req.body;
	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ message: "Invalid credentials" });

	const match = await user.comparePassword(password);
	if (!match) return res.status(401).json({ message: "Invalid credentials" });

	const token = signToken(user._id);
	res.json({
		user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
		token,
	});
}

export async function me(req, res) {
	res.json({ user: req.user });
}

// ✅ Google OAuth callback
export const googleCallback = async (req, res) => {
	try {
		// At this point, passport strategy already resolved/created the DB user
		const dbUser = req.user;

		if (!dbUser || !dbUser._id) {
			return res.status(401).json({ message: 'Google authentication failed' });
		}

    const token = signToken(dbUser._id);

    // Redirect to frontend with JWT token
    const frontendBase = process.env.FRONTEND_URL || process.env.CLIENT_BASE_URL || 'http://localhost:3000';
    return res.redirect(`${frontendBase}/auth/callback?token=${token}`);
	} catch (error) {
		return res.status(500).json({ message: 'Google login failed', error: error.message });
	}
};

// ✅ Profile functions (unchanged)
export const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id)
			.populate("wishlist")
			.populate("bookingHistory.tour")
			.select("-password");

		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, avatar } = req.body;
		const user = await User.findById(req.user._id);

		if (name) user.name = name;
		if (avatar) user.avatar = avatar;

		await user.save();
		res.json({
			message: "Profile updated successfully",
			user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
		});
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToWishlist = async (req, res) => {
	try {
		const { tourId } = req.params;
		const user = await User.findById(req.user._id);

		if (!user.wishlist.includes(tourId)) {
			user.wishlist.push(tourId);
			await user.save();
		}

		res.json({ message: "Added to wishlist" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeFromWishlist = async (req, res) => {
	try {
		const { tourId } = req.params;
		const user = await User.findById(req.user._id);

		user.wishlist = user.wishlist.filter((id) => id.toString() !== tourId);
		await user.save();

		res.json({ message: "Removed from wishlist" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
