module.exports = (err, _req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join('; ') })
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid record identifier or field value.' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large. Use smaller images or fewer rows.' })
  console.error(err.message)
  res.status(500).json({ error: 'The request could not be completed. Please try again.' })
}
