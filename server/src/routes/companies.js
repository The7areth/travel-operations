const router = require('express').Router()
const Company = require('../models/Company')

router.get('/', async (req, res) => {
  res.json(await Company.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Company.create(req.body))
})
router.put('/:id', async (req, res) => {
  res.json(await Company.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
router.delete('/:id', async (req, res) => {
  await Company.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})
module.exports = router
