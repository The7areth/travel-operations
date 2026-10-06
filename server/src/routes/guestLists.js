const router = require('express').Router()
const GuestList = require('../models/GuestList')

const populate = query => query.populate('company').populate('versions.hotel').sort({ updatedAt: -1 })

router.get('/', async (req, res) => {
  res.json(await populate(GuestList.find()))
})

router.get('/:id', async (req, res) => {
  const list = await GuestList.findById(req.params.id).populate('company').populate('versions.hotel')
  if (!list) return res.status(404).json({ error: 'Guest list not found' })
  res.json(list)
})

router.post('/', async (req, res) => {
  const created = await GuestList.create(req.body)
  res.status(201).json(await GuestList.findById(created._id).populate('company').populate('versions.hotel'))
})

router.put('/:id', async (req, res) => {
  const updated = await GuestList.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('company')
    .populate('versions.hotel')
  if (!updated) return res.status(404).json({ error: 'Guest list not found' })
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  await GuestList.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

module.exports = router
