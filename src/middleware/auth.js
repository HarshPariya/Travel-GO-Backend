import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];
		if (!token) return res.status(401).json({ message: "Access token required" });
		if (!process.env.JWT_SECRET) return res.status(500).json({ message: "Server misconfigured: JWT_SECRET not set" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId).select("-password");
		if (!user) return res.status(401).json({ message: "Invalid token" });

		req.user = user;
		next();
	} catch (error) {
		return res.status(403).json({ message: "Invalid or expired token" });
	}
};

export const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];
		if (token) {
			if (!process.env.JWT_SECRET) return next();
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const user = await User.findById(decoded.userId).select("-password");
			req.user = user;
		}
		next();
	} catch {
		next(); // continue even if token fails
	}
};

export const requireAdmin = async (req, res, next) => {
	try {
		if (!req.user) return res.status(401).json({ message: "Authentication required" });
		if (!req.user.isAdmin) return res.status(403).json({ message: "Admin access required" });
		next();
	} catch {
		return res.status(500).json({ message: "Server error" });
	}
};
