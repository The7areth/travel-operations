const router = require('../http/router')()
const Company = require('../models/Company')

router.get('/', async (req, res) => {
  res.json(await Company.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Company.create(req.body))
})
router.put('/:id', async (req, res) => {
  const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!updated) return res.status(404).json({ error: 'Record not found' })
  res.json(updated)
})
router.delete('/:id', async (req, res) => {
  const deleted = await Company.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Record not found' })
  res.json({ ok: true })
})
module.exports = router
