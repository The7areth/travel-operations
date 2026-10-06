require('dotenv').config()
const mongoose = require('mongoose')
const fixtures = require('./demo/fixtures.json')

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_portfolio_demo'
  await mongoose.connect(uri)
  if (mongoose.connection.name !== 'travel_portfolio_demo') throw new Error('Seed only supports the travel_portfolio_demo database')
  const mapping = { people: 'Person', companies: 'Company', hotels: 'Hotel', destinations: 'Destination', templates: 'Template', offers: 'Offer', guestLists: 'GuestList', serviceConfirmations: 'ServiceConfirmation' }
  const ids = {}
  function collect(value) {
    if (Array.isArray(value)) return value.forEach(collect)
    if (value && typeof value === 'object') { if (value._id) ids[value._id] = new mongoose.Types.ObjectId(); Object.values(value).forEach(collect) }
  }
  collect(fixtures)
  function convert(value, key = '') {
    if (Array.isArray(value)) return value.map(v => convert(v, key))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,convert(v,k)]))
    if (['_id','company','people','template','destinations','destination','hotel'].includes(key) && ids[value]) return ids[value]
    return value
  }
  for (const [collection, name] of Object.entries(mapping)) {
    const Model = require('./models/' + name)
    if (await Model.countDocuments()) throw new Error('Demo database must be empty; existing records are never deleted')
  }
  for (const [collection, name] of Object.entries(mapping)) await require('./models/' + name).insertMany(convert(fixtures[collection]))
  console.log('Fictional demo records inserted.')
}
seed().catch(err => { console.error(err.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())
