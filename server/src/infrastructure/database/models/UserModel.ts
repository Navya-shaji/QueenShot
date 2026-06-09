import mongoose from 'mongoose';

/**
 * UserModel Schema Definition
 * Infrastructure detail outlining the MongoDB physical model representation of a user.
 */
const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // String ID allows compatibility with FirebaseAuth IDs, custom UUIDs, or standard ObjectIds
      required: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 25
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: 'https://api.dicebear.com/7.x/bottts/svg?seed=DefaultStriker'
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    gamesLost: {
      type: Number,
      default: 0
    },
    eloRating: {
      type: Number,
      default: 1200
    },
    coinsCollected: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true, // Auto-manages createdAt and updatedAt
    _id: false // Disable auto-generation of ObjectId since we provide a custom _id (string)
  }
);

export default mongoose.models['User'] || mongoose.model('User', UserSchema);
