const router = require('express').Router()
const Person = require('../models/Person')

router.get('/', async (req, res) => {
  res.json(await Person.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Person.create(req.body))
})
router.put('/:id', async (req, res) => {
  res.json(await Person.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})
router.delete('/:id', async (req, res) => {
  await Person.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})
module.exports = router
