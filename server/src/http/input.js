// Preserve server-owned identity and export history when a form sends a whole record.
module.exports = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') return res.status(400).json({ error: 'Expected an object.' })
    for (const key of Object.keys(req.body)) {
      if (key.startsWith('$') || key.includes('.')) return res.status(400).json({ error: 'Invalid field name.' })
      if (['_id', '__v', 'exports', 'createdAt', 'updatedAt'].includes(key)) delete req.body[key]
    }
    if (req.method === 'POST' && /^\/(people|companies|hotels|destinations|templates|guest-lists|service-confirmations)\/?$/.test(req.path) && !('name' in req.body)) return res.status(400).json({ error: 'Name is required.' })
    if ('name' in req.body && (typeof req.body.name !== 'string' || !req.body.name.trim())) return res.status(400).json({ error: 'Name is required.' })
    if (Array.isArray(req.body.options) && req.body.options.some(o => !o || typeof o.label !== 'string' || !o.label.trim() || typeof o.price !== 'number' || !Number.isFinite(o.price) || o.price < 0)) return res.status(400).json({ error: 'Each price option needs a label and a non-negative price.' })
  }
  next()
}
