const router = require('express').Router()
const ServiceConfirmation = require('../models/ServiceConfirmation')

const populate = query => query.populate('company').sort({ updatedAt: -1 })

router.get('/', async (_req, res) => {
  res.json(await populate(ServiceConfirmation.find()))
})

router.get('/:id', async (req, res) => {
  const item = await ServiceConfirmation.findById(req.params.id).populate('company')
  if (!item) return res.status(404).json({ error: 'Service confirmation not found' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const created = await ServiceConfirmation.create(req.body)
  res.status(201).json(await ServiceConfirmation.findById(created._id).populate('company'))
})

router.put('/:id', async (req, res) => {
  const updated = await ServiceConfirmation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('company')
  if (!updated) return res.status(404).json({ error: 'Service confirmation not found' })
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  await ServiceConfirmation.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

module.exports = router
