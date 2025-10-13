import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: null },
    isAdmin: { type: Boolean, default: false },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour'
    }],
    bookingHistory: [{
      tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
      },
      bookingDate: {
        type: Date,
        default: Date.now
      },
      travelers: {
        type: Number,
        required: true
      },
      totalPrice: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
      }
    }]
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

