const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'owner', 'admin'],
      default: 'customer',
    },
    history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reservations',
      },
    ],
    fcm_token: String,
    preferences: {
      dietary: [{ type: String }],
      favorite_table: { type: mongoose.Schema.Types.ObjectId },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for email and phone for faster searching
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('users', userSchema);
