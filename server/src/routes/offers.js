const router = require('express').Router()
const Offer = require('../models/Offer')

router.get('/', async (req, res) => {
  res.json(await Offer.find()
    .populate('company')
    .populate('people')
    .populate('template')
    .sort({ createdAt: -1 }))
})
router.get('/:id', async (req, res) => {
  res.json(await Offer.findById(req.params.id)
    .populate('company')
    .populate('people')
    .populate('template')
    .populate('days.destinations'))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Offer.create(req.body))
})
router.put('/:id', async (req, res) => {
  res.json(await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }))
})
router.delete('/:id', async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})
module.exports = router
