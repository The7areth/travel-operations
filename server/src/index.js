require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./db')

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use('/api', require('./http/input'))

app.use('/api/people', require('./routes/people'))
app.use('/api/guest-lists', require('./routes/guestLists'))
app.use('/api/hotels', require('./routes/hotels'))
app.use('/api/service-confirmations', require('./routes/serviceConfirmations'))
app.use('/api/companies', require('./routes/companies'))
app.use('/api/destinations', require('./routes/destinations'))
app.use('/api/templates', require('./routes/templates'))
app.use('/api/offers', require('./routes/offers'))
app.use('/api/pdf', require('./routes/pdf'))
app.use('/api/images', require('./routes/images'))

app.use(require('./http/errors'))
module.exports = app
if (require.main === module) {
  connectDB().then(() => {
    app.listen(process.env.PORT || 3001, process.env.HOST || '127.0.0.1', () => console.log('Travel API ready'))
  }).catch(err => { console.error('Database connection failed:', err.message); process.exitCode = 1 })
}
