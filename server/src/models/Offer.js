const { Schema, model } = require('mongoose')

const DaySchema = new Schema({
  destinations: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
  activities: [{
    destination: { type: Schema.Types.ObjectId, ref: 'Destination' },
    activityId: { type: String, default: '' },
    priceId: { type: String, default: '' },
    activityName: { type: String, required: true },
    optionLabel: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePositionX: { type: Number, default: 50 },
    imagePositionY: { type: Number, default: 50 },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    notes: { type: String, default: '' },
  }],
  notes: { type: String, default: '' },
}, { _id: false })

const OptionSchema = new Schema({
  label: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
}, { _id: false })

const ExportSchema = new Schema({
  sequence: { type: Number, required: true },
  label: { type: String, required: true },
  filename: { type: String, required: true },
  kind: { type: String, default: 'offer-pdf' },
  exportedAt: { type: Date, default: Date.now },
}, { _id: true })

const OfferSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  people: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
  template: { type: Schema.Types.ObjectId, ref: 'Template' },
  days: [DaySchema],
  options: [OptionSchema],
  exports: [ExportSchema],
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted'], default: 'Draft' },
}, { timestamps: true })

module.exports = model('Offer', OfferSchema)
