const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'restaurants', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    table_id: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    party_size: { type: Number, required: true },
    special_requests: String,
    lifecycle: [
      {
        action: { type: String, enum: ['booked', 'seated', 'ordered', 'paid', 'finished'] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

reservationSchema.index({ restaurant_id: 1, start_time: 1 });
reservationSchema.index({ user_id: 1, start_time: 1 });

module.exports = mongoose.model('reservations', reservationSchema);
