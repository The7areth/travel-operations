const mongoose = require('mongoose')

module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_portfolio_demo')
  console.log('MongoDB connected')
}
