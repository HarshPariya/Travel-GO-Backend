import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const name = profile.displayName || "Google User";
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;

        // Find user by googleId or fallback to email
        let user = await User.findOne({ googleId });
        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (user) {
          // Update missing fields
          if (!user.googleId) user.googleId = googleId;
          if (avatar) user.avatar = avatar;
          await user.save();
        } else {
          // Create a new user
          user = await User.create({ googleId, name, email, avatar });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize & deserialize for session support (optional)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
