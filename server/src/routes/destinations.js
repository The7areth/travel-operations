const router = require('../http/router')()
const Destination = require('../models/Destination')

router.get('/', async (req, res) => {
  res.json(await Destination.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Destination.create(req.body))
})
router.put('/:id', async (req, res) => {
  const updated = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!updated) return res.status(404).json({ error: 'Record not found' })
  res.json(updated)
})
router.delete('/:id', async (req, res) => {
  const deleted = await Destination.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Record not found' })
  res.json({ ok: true })
})
module.exports = router
