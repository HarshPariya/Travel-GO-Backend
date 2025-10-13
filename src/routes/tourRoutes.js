// backend/routes/tourRoutes.js
import { Router } from "express";
import {
  createTour,
  deleteTour,
  getTour,
  listTours,
  updateTour,
  validateTour,
  addReview,
  getAvailability,
  getTourStats,
} from "../controllers/tourController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/", listTours);
router.get("/stats", getTourStats); // New stats endpoint
router.get("/:slug", getTour);
router.get("/:slug/availability", getAvailability);

// Reviews
router.post("/:slug/reviews", requireAuth, addReview);

// Admin-only CRUD
router.post("/", requireAuth, requireAdmin, validateTour, createTour);
router.put("/:slug", requireAuth, requireAdmin, updateTour);
router.delete("/:slug", requireAuth, requireAdmin, deleteTour);

export default router;
