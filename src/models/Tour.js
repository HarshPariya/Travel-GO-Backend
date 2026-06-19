import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, required: true },
    location: { type: String, required: true },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.7, min: 0, max: 5 },
  },
  { timestamps: true }
);

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);
export default Tour;

