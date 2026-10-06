const router = require('../http/router')()
const Offer = require('../models/Offer')

router.get('/', async (req, res) => {
  res.json(await Offer.find()
    .populate('company')
    .populate('people')
    .populate('template')
    .sort({ createdAt: -1 }))
})
router.get('/:id', async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate('company')
    .populate('people')
    .populate('template')
    .populate('days.destinations')
  if (!offer) return res.status(404).json({ error: 'Offer not found' })
  res.json(offer)
})
router.post('/', async (req, res) => {
  res.status(201).json(await Offer.create(req.body))
})
router.put('/:id', async (req, res) => {
  const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!updated) return res.status(404).json({ error: 'Record not found' })
  res.json(updated)
})
router.delete('/:id', async (req, res) => {
  const deleted = await Offer.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Record not found' })
  res.json({ ok: true })
})
module.exports = router
