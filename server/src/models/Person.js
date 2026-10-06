const { Schema, model } = require('mongoose')

const PersonSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  properties: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = model('Person', PersonSchema)
