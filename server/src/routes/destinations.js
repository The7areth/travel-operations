const router = require('express').Router()
const Destination = require('../models/Destination')

router.get('/', async (req, res) => {
  res.json(await Destination.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Destination.create(req.body))
})
router.put('/:id', async (req, res) => {
  res.json(await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }))
})
router.delete('/:id', async (req, res) => {
  await Destination.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})
module.exports = router
