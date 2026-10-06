const { Schema, model } = require('mongoose')

const CompanySchema = new Schema({
  name: { type: String, required: true },
  logo: { type: String },
  properties: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = model('Company', CompanySchema)
