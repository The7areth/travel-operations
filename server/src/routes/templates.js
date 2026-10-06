const router = require('express').Router()
const Template = require('../models/Template')

router.get('/', async (req, res) => {
  res.json(await Template.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Template.create(req.body))
})
router.put('/:id', async (req, res) => {
  res.json(await Template.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
router.delete('/:id', async (req, res) => {
  await Template.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})
module.exports = router
