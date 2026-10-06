const { Schema, model } = require('mongoose')

const BlockSchema = new Schema({
  type: { type: String, enum: ['cover', 'day', 'pricing', 'freetext'], required: true },
  content: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false })

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  blocks: [BlockSchema],
}, { timestamps: true })

module.exports = model('Template', TemplateSchema)
