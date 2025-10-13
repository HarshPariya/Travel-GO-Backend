import { body, validationResult } from "express-validator";
import Tour from "../models/Tour.js";

/* -------------------- LIST TOURS -------------------- */
export async function listTours(req, res) {
  try {
    const { 
      q, 
      featured, 
      category, 
      minPrice, 
      maxPrice, 
      minRating, 
      location,
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    const sort = {};

    // Search functionality
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }

    // Filter by featured
    if (featured === "true") filter.featured = true;

    // Filter by category
    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    // Filter by location
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Sorting
    const validSortFields = ['createdAt', 'price', 'rating', 'title', 'durationDays'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sort[sortField] = sortDirection;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [tours, totalCount] = await Promise.all([
      Tour.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-__v') // Exclude version field
        .lean(), // Use lean() for better performance
      Tour.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Response with pagination metadata
    res.json({
      tours,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null
      },
      filters: {
        search: q || null,
        category: category || null,
        location: location || null,
        priceRange: { min: minPrice || null, max: maxPrice || null },
        minRating: minRating || null,
        featured: featured === "true" || null
      }
    });
  } catch (err) {
    console.error('Error fetching tours:', err);
    res.status(500).json({ 
      message: "Error fetching tours", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}

/* -------------------- GET TOUR -------------------- */
export async function getTour(req, res) {
  try {
    const { slug } = req.params;
    const { mobile = false } = req.query;
    
    let tour = await Tour.findOne({ slug });
    if (!tour) {
      // Try to find by ID if slug not found
      try {
        tour = await Tour.findById(slug);
      } catch (_) {}
    }
    
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    // Mobile-optimized response
    if (mobile === 'true') {
      const mobileTour = {
        _id: tour._id,
        slug: tour.slug,
        title: tour.title,
        location: tour.location,
        price: tour.price,
        durationDays: tour.durationDays,
        imageUrl: tour.imageUrl,
        rating: tour.rating,
        numReviews: tour.numReviews,
        category: tour.category,
        featured: tour.featured,
        shortDescription: tour.description?.substring(0, 150) + '...',
        highlights: tour.highlights || [],
        included: tour.included || [],
        createdAt: tour.createdAt
      };
      return res.json(mobileTour);
    }

    res.json(tour);
  } catch (err) {
    console.error('Error fetching tour:', err);
    res.status(500).json({ 
      message: "Error fetching tour", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}

/* -------------------- TOUR VALIDATION -------------------- */
export const validateTour = [
  body("title").isString().isLength({ min: 2 }),
  body("slug").isString().isLength({ min: 2 }),
  body("description").isString().isLength({ min: 10 }),
  body("price").isFloat({ min: 0 }),
  body("durationDays").isInt({ min: 1 }),
  body("imageUrl").isString().isLength({ min: 4 }),
  body("location").isString().isLength({ min: 2 }),
];

/* -------------------- CREATE TOUR -------------------- */
export async function createTour(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const tour = await Tour.create(req.body);
    res.status(201).json(tour);
  } catch (err) {
    res.status(500).json({ message: "Error creating tour", error: err.message });
  }
}

/* -------------------- UPDATE TOUR -------------------- */
export async function updateTour(req, res) {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOneAndUpdate({ slug }, req.body, { new: true });
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: "Error updating tour", error: err.message });
  }
}

/* -------------------- DELETE TOUR -------------------- */
export async function deleteTour(req, res) {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOneAndDelete({ slug });
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tour", error: err.message });
  }
}

/* -------------------- TOUR AVAILABILITY -------------------- */
export async function getAvailability(req, res) {
  try {
    const { slug } = req.params;
    let tour = await Tour.findOne({ slug });
    if (!tour) {
      try {
        tour = await Tour.findById(slug);
      } catch (_) {}
    }
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const today = new Date();
    const slots = [];
    for (let i = 1; i <= 24; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i * 3);
      const capacity = 24;
      const pseudo = (tour.title?.length || 7) * (i + 3);
      const booked = pseudo % capacity;
      const remaining = Math.max(0, capacity - booked);
      slots.push({ date: d.toISOString().split('T')[0], capacity, remaining });
    }

    res.json({ tourId: tour._id, slug: tour.slug, slots });
  } catch (err) {
    res.status(500).json({ message: "Error fetching availability", error: err.message });
  }
}

/* -------------------- REVIEW VALIDATION -------------------- */
export const validateReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("text")
    .isString()
    .isLength({ min: 5 })
    .withMessage("Review text must be at least 5 characters long"),
];

/* -------------------- ADD REVIEW -------------------- */
export async function addReview(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { slug } = req.params;
    const { text, rating } = req.body;

    const tour = await Tour.findOne({ slug });
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const review = {
      user: req.user?.name || "Anonymous",
      rating: Number(rating),
      text,
      createdAt: new Date(),
    };

    // Add new review
    tour.reviews.push(review);

    // Update stats
    tour.numReviews = tour.reviews.length;
    tour.averageRating =
      tour.reviews.reduce((acc, r) => acc + r.rating, 0) / tour.numReviews;

    await tour.save();

    res.status(201).json({
      message: "Review added successfully",
      review,
      averageRating: tour.averageRating,
      numReviews: tour.numReviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
}

/* -------------------- GET TOUR STATISTICS -------------------- */
export async function getTourStats(req, res) {
  try {
    const stats = await Tour.aggregate([
      {
        $group: {
          _id: null,
          totalTours: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: "$numReviews" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" }
        }
      }
    ]);

    const categories = await Tour.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          averageRating: { $avg: "$rating" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const locations = await Tour.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: stats[0] || {
        totalTours: 0,
        averagePrice: 0,
        averageRating: 0,
        totalReviews: 0,
        minPrice: 0,
        maxPrice: 0
      },
      categories,
      popularLocations: locations
    });
  } catch (err) {
    console.error('Error fetching tour stats:', err);
    res.status(500).json({ 
      message: "Error fetching tour statistics", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}
