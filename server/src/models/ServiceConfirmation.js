const { Schema, model } = require('mongoose')

const ServiceRowSchema = new Schema({
  type: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, default: 'Confirmed' },
}, { _id: true })

const ServiceDaySchema = new Schema({
  title: { type: String, required: true },
  rows: [ServiceRowSchema],
}, { _id: true })

const ServiceVersionSchema = new Schema({
  label: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Updated'], default: 'Draft' },
  guests: { type: String, default: '' },
  totalTravelers: { type: String, default: '' },
  rooms: { type: String, default: '' },
  travelersContact: { type: String, default: '' },
  client: { type: String, default: '' },
  destination: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  dietaryNotes: { type: String, default: '' },
  days: [ServiceDaySchema],
  notes: { type: String, default: '' },
  sentAt: { type: Date },
}, { _id: true, timestamps: true })

const ExportSchema = new Schema({
  sequence: { type: Number, required: true },
  versionIndex: { type: Number, default: 0 },
  versionLabel: { type: String, default: '' },
  filename: { type: String, required: true },
  kind: { type: String, default: 'service-confirmation-pdf' },
  exportedAt: { type: Date, default: Date.now },
}, { _id: true })

const ServiceConfirmationSchema = new Schema({
  name: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  groupReference: { type: String, default: '' },
  tourDates: { type: String, default: '' },
  sendBy: { type: String, default: '' },
  versions: [ServiceVersionSchema],
  exports: [ExportSchema],
}, { timestamps: true })

module.exports = model('ServiceConfirmation', ServiceConfirmationSchema)
