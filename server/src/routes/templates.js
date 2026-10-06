const router = require('../http/router')()
const Template = require('../models/Template')

router.get('/', async (req, res) => {
  res.json(await Template.find().sort({ name: 1 }))
})
router.post('/', async (req, res) => {
  res.status(201).json(await Template.create(req.body))
})
router.put('/:id', async (req, res) => {
  const updated = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!updated) return res.status(404).json({ error: 'Record not found' })
  res.json(updated)
})
router.delete('/:id', async (req, res) => {
  const deleted = await Template.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Record not found' })
  res.json({ ok: true })
})
module.exports = router
