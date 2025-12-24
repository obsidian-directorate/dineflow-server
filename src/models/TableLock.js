const mongoose = require('mongoose');

const tableLockSchema = new mongoose.Schema(
  {
    table_id: { type: String, required: true, unique: true },
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'restaurants', required: true },
    lock_until: { type: Date, required: true },
    locked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete all expired locks (1 minutes)
tableLockSchema.index({ lock_until: 1 }, { expireAfterSeconds: 60 });

// Compound index for faster searching
tableLockSchema.index({ restaurant_id: 1, table_id: 1 });

module.exports = mongoose.model('table_locks', tableLockSchema);
