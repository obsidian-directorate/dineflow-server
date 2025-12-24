const mongoose = require('mongoose');

const operatingHourSchema = new mongoose.Schema({
  day: { type: String, required: true },
  open: { type: String, required: true },
  close: { type: String, required: true },
});

const zoneSchema = new mongoose.Schema({
  zoneName: { type: String, required: true },
  backgroundImage: String,
  tables: [
    {
      table_number: { type: String, required: true },
      x: { type: Number, default: 0.5 },
      y: { type: Number, default: 0.5 },
      is_joinable: { type: Boolean, default: false },
      capacity: { type: Number, default: 6 },
      metadata: {
        hasPowerOutlet: Boolean,
        windowView: Boolean,
      },
    },
  ],
});

const restaurantSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    zones: [zoneSchema],
    operating_hours: [operatingHourSchema],
    settings: {
      min_booking_notice: { type: Number, default: 2 },
      max_party_size: { type: Number, default: 10 },
    },
    theme: {
      brand_color: { type: String, default: '#E64A19' },
      accent_color: { type: String, default: '#263238' },
      table_color: { type: String, default: '#4CAF50' },
      is_dark: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('restaurants', restaurantSchema);
