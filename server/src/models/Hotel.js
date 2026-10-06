const { Schema, model } = require('mongoose')

const RoomTypeSchema = new Schema({
  name: { type: String, required: true },
  notes: { type: String, default: '' },
}, { _id: true })

const HotelSchema = new Schema({
  name: { type: String, required: true },
  city: { type: String, default: '' },
  country: { type: String, default: '' },
  emails: [{ type: String }],
  phone: { type: String, default: '' },
  mealBasis: { type: String, enum: ['B&B', 'Half Board', 'Full Board', 'Custom'], default: 'B&B' },
  contractNotes: { type: String, default: '' },
  roomTypes: [RoomTypeSchema],
}, { timestamps: true })

module.exports = model('Hotel', HotelSchema)
