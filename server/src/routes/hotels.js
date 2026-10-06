const router = require('express').Router()
const Hotel = require('../models/Hotel')

router.get('/', async (_req, res) => {
  res.json(await Hotel.find().sort({ name: 1 }))
})

router.post('/', async (req, res) => {
  res.status(201).json(await Hotel.create(req.body))
})

router.put('/:id', async (req, res) => {
  const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!updated) return res.status(404).json({ error: 'Hotel not found' })
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

module.exports = router
