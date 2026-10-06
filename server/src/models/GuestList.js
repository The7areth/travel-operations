const { Schema, model } = require('mongoose')

const GuestSchema = new Schema({
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['', 'M', 'F'], default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  nationality: { type: String, default: '' },
  roomNumber: { type: String, default: '' },
  roomOccupancy: { type: String, enum: ['', 'DBL', 'Twin', 'SGL'], default: '' },
  roomType: { type: String, default: '' },
  checkIn: { type: String, default: '' },
  checkOut: { type: String, default: '' },
  nights: { type: String, default: '' },
  arrivalTime: { type: String, default: '' },
  preExtension: { type: Boolean, default: false },
  postExtension: { type: Boolean, default: false },
  roomingNotes: { type: String, default: '' },
}, { _id: true })

const GuestListVersionSchema = new Schema({
  label: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Partial', 'Final'], default: 'Partial' },
  groupReference: { type: String, default: '' },
  hotel: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  hotelName: { type: String, default: '' },
  hotelEmail: { type: String, default: '' },
  roomSummary: { type: String, default: '' },
  totalRooms: { type: String, default: '' },
  totalGuests: { type: String, default: '' },
  mealBasis: { type: String, enum: ['B&B', 'Half Board', 'Full Board', 'Custom'], default: 'B&B' },
  mealPlan: { type: String, default: '' },
  payment: { type: String, default: '' },
  extra: { type: String, default: '' },
  ratesNotes: { type: String, default: '' },
  doubleRate: { type: String, default: '' },
  twinRate: { type: String, default: '' },
  singleRate: { type: String, default: '' },
  notes: { type: String, default: '' },
  sharedAt: { type: Date },
  guests: [GuestSchema],
}, { _id: true, timestamps: true })

const ExportSchema = new Schema({
  sequence: { type: Number, required: true },
  versionIndex: { type: Number, default: 0 },
  versionLabel: { type: String, default: '' },
  filename: { type: String, required: true },
  kind: { type: String, default: 'rooming-list-pdf' },
  exportedAt: { type: Date, default: Date.now },
}, { _id: true })

const GuestListSchema = new Schema({
  name: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, enum: ['FIT', 'Group'], default: 'FIT' },
  versions: [GuestListVersionSchema],
  exports: [ExportSchema],
}, { timestamps: true })

module.exports = model('GuestList', GuestListSchema)
