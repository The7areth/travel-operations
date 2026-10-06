const { Schema, model } = require('mongoose')

const ActivityPriceSchema = new Schema({
  label: { type: String, required: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  notes: { type: String, default: '' },
}, { _id: true })

const ActivitySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '' },
  image: { type: String, default: '' },
  imagePositionX: { type: Number, default: 50 },
  imagePositionY: { type: Number, default: 50 },
  prices: [ActivityPriceSchema],
}, { _id: true })

const DestinationSchema = new Schema({
  name: { type: String, required: true },
  country: { type: String },
  description: { type: String, default: '' },
  coverImage: { type: String },
  imagePositionX: { type: Number, default: 50 },
  imagePositionY: { type: Number, default: 50 },
  activities: [ActivitySchema],
  properties: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = model('Destination', DestinationSchema)
