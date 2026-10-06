const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const fs = require('fs')
const { buildOfferHtml, buildRoomingListHtml, buildServiceConfirmationHtml, slug } = require('../pdf/template')

const app = express()
// Forward rejected asynchronous handlers to Express 4's error middleware.
for (const method of ['get', 'post', 'put', 'delete']) {
  const register = app[method].bind(app)
  app[method] = (path, handler) => handler === undefined ? register(path) : register(path, (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next))
}
app.get('/api/health', (_req, res) => res.json({ status: 'ready', mode: 'offline-demo', persistence: 'memory' }))
app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use('/api', require('../http/input'))

function normalizeImageUrl(raw) {
  const url = new URL(raw)
  if (url.hostname === 'images.unsplash.com' || url.hostname === 'plus.unsplash.com') {
    if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
    if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'crop')
    if (!url.searchParams.has('w')) url.searchParams.set('w', '1400')
    if (!url.searchParams.has('q')) url.searchParams.set('q', '85')
  }
  return url.toString()
}

function extractMetaImage(html) {
  const match = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i)
  return match?.[1]?.replace(/&amp;/g, '&') ?? ''
}

const now = new Date().toISOString()
let seq = 100
const id = () => String(seq++)
app.use((req, _res, next) => {
  if (['/api/guest-lists', '/api/service-confirmations'].some(path => req.path === path || req.path.startsWith(path + '/')) && Array.isArray(req.body?.versions)) {
    req.body.versions = req.body.versions.map(version => ({ ...version, _id: version._id || id() }))
  }
  next()
})


function sendPdf(res, pdf, filename) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdf.length,
  })
  res.send(pdf)
}

function browserExecutablePath() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Zen.app/Contents/MacOS/zen',
  ].find(path => path && fs.existsSync(path))
}

async function renderPdf(html, options = {}) {
  let browser
  try {
    const executablePath = browserExecutablePath()
    browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', request => /^(data:|about:)/.test(request.url()) ? request.continue() : request.abort())
    await page.setContent(html, { waitUntil: 'load', timeout: 45000 })
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, ...options })
  } finally {
    if (browser) await browser.close()
  }
}

const fixtures = require('./fixtures.json')
const { people, companies, hotels, destinations, templates } = structuredClone(fixtures)
let { offers, guestLists, serviceConfirmations } = structuredClone(fixtures)
for (const items of [people, companies, hotels, destinations, templates, offers, guestLists, serviceConfirmations]) {
  for (const item of items) { item.createdAt = now; item.updatedAt = now }
}

const collections = {
  people,
  companies,
  hotels,
  destinations,
  templates,
}

function normalizeGuestList(list) {
  return {
    ...list,
    company: typeof list.company === 'string' ? companies.find(x => x._id === list.company) : list.company,
  }
}

function normalizeOffer(offer) {
  return {
    ...offer,
    company: typeof offer.company === 'string' ? companies.find(x => x._id === offer.company) : offer.company,
    people: (offer.people || []).map(x => typeof x === 'string' ? people.find(p => p._id === x) : x).filter(Boolean),
    template: typeof offer.template === 'string' ? templates.find(x => x._id === offer.template) : offer.template,
    days: (offer.days || []).map(day => ({
      ...day,
      destinations: (day.destinations || []).map(x => typeof x === 'string' ? destinations.find(d => d._id === x) : x).filter(Boolean),
      activities: (day.activities || []).map(activity => ({
        ...activity,
        destination: typeof activity.destination === 'string'
          ? destinations.find(d => d._id === activity.destination)?._id ?? activity.destination
          : activity.destination?._id ?? activity.destination,
      })),
    })),
  }
}

function crud(name) {
  const items = collections[name]
  app.get(`/api/${name}`, (_req, res) => res.json(items))
  app.post(`/api/${name}`, (req, res) => {
    const item = { _id: id(), properties: {}, ...req.body, createdAt: now }
    items.push(item)
    res.status(201).json(item)
  })
  app.put(`/api/${name}/:id`, (req, res) => {
    const index = items.findIndex(x => x._id === req.params.id)
    if (index < 0) return res.status(404).json({ error: 'Not found' })
    items[index] = { ...items[index], ...req.body }
    res.json(items[index])
  })
  app.delete(`/api/${name}/:id`, (req, res) => {
    const index = items.findIndex(x => x._id === req.params.id)
    if (index >= 0) items.splice(index, 1)
    res.json({ ok: true })
  })
}

Object.keys(collections).forEach(crud)

app.get('/api/guest-lists', (_req, res) => res.json(guestLists.map(normalizeGuestList)))
app.get('/api/guest-lists/:id', (req, res) => {
  const list = guestLists.find(x => x._id === req.params.id)
  if (!list) return res.status(404).json({ error: 'Not found' })
  res.json(normalizeGuestList(list))
})
app.post('/api/guest-lists', (req, res) => {
  const list = { _id: id(), versions: [], ...req.body, createdAt: now, updatedAt: now }
  guestLists.unshift(list)
  res.status(201).json(normalizeGuestList(list))
})
app.put('/api/guest-lists/:id', (req, res) => {
  const index = guestLists.findIndex(x => x._id === req.params.id)
  if (index < 0) return res.status(404).json({ error: 'Not found' })
  guestLists[index] = { ...guestLists[index], ...req.body, updatedAt: new Date().toISOString() }
  res.json(normalizeGuestList(guestLists[index]))
})
app.delete('/api/guest-lists/:id', (req, res) => {
  guestLists = guestLists.filter(x => x._id !== req.params.id)
  res.json({ ok: true })
})

app.get('/api/service-confirmations', (_req, res) => res.json(serviceConfirmations))
app.get('/api/service-confirmations/:id', (req, res) => {
  const item = serviceConfirmations.find(x => x._id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})
app.post('/api/service-confirmations', (req, res) => {
  const item = { _id: id(), versions: [], exports: [], ...req.body, createdAt: now, updatedAt: now }
  serviceConfirmations.unshift(item)
  res.status(201).json(item)
})
app.put('/api/service-confirmations/:id', (req, res) => {
  const index = serviceConfirmations.findIndex(x => x._id === req.params.id)
  if (index < 0) return res.status(404).json({ error: 'Not found' })
  serviceConfirmations[index] = { ...serviceConfirmations[index], ...req.body, updatedAt: new Date().toISOString() }
  res.json(serviceConfirmations[index])
})
app.delete('/api/service-confirmations/:id', (req, res) => {
  serviceConfirmations = serviceConfirmations.filter(x => x._id !== req.params.id)
  res.json({ ok: true })
})

app.post('/api/images/resolve', async (req, res) => {
  try {
    const raw = String(req.body?.url ?? '').trim()
    const url = new URL(raw)
    if (url.hostname === 'images.unsplash.com' || url.hostname === 'plus.unsplash.com' || /\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) {
      return res.json({ url: normalizeImageUrl(url.toString()) })
    }
    if (url.hostname !== 'unsplash.com' && url.hostname !== 'www.unsplash.com') {
      return res.status(400).json({ error: 'Use a direct image URL, an Unsplash photo page, or upload a file.' })
    }
    const response = await fetch(url.toString(), { headers: { 'User-Agent': 'Tours image resolver' } })
    const html = await response.text()
    const imageUrl = extractMetaImage(html)
    if (!imageUrl) return res.status(400).json({ error: 'Could not find an image on that page' })
    res.json({ url: normalizeImageUrl(new URL(imageUrl, url).toString()) })
  } catch (err) {
    res.status(400).json({ error: 'Could not resolve that image URL' })
  }
})

app.get('/api/offers', (_req, res) => res.json(offers.map(normalizeOffer)))
app.get('/api/offers/:id', (req, res) => {
  const offer = offers.find(x => x._id === req.params.id)
  if (!offer) return res.status(404).json({ error: 'Not found' })
  res.json(normalizeOffer(offer))
})
app.post('/api/offers', (req, res) => {
  const offer = { _id: id(), days: [], options: [], people: [], status: 'Draft', ...req.body, createdAt: now }
  offers.unshift(offer)
  res.status(201).json(normalizeOffer(offer))
})
app.put('/api/offers/:id', (req, res) => {
  const index = offers.findIndex(x => x._id === req.params.id)
  if (index < 0) return res.status(404).json({ error: 'Not found' })
  offers[index] = { ...offers[index], ...req.body }
  res.json(normalizeOffer(offers[index]))
})
app.delete('/api/offers/:id', (req, res) => {
  offers = offers.filter(x => x._id !== req.params.id)
  res.json({ ok: true })
})

app.get('/api/pdf/guest-lists/:id/:versionIndex', async (req, res) => {
  const list = guestLists.find(x => x._id === req.params.id)
  if (!list) return res.status(404).json({ error: 'Not found' })
  const version = list.versions[Number(req.params.versionIndex || 0)]
  if (!version) return res.status(404).json({ error: 'Version not found' })
  const sequence = (list.exports?.length ?? 0) + 1
  const filename = `${list.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v${sequence}.pdf`
  const exportInfo = {
    _id: id(),
    sequence,
    versionIndex: Number(req.params.versionIndex || 0),
    versionLabel: version.label,
    filename,
    kind: 'rooming-list-pdf',
    exportedAt: new Date().toISOString(),
  }
  const pdf = await renderPdf(buildRoomingListHtml(normalizeGuestList(list), version, exportInfo), { landscape: true })
  list.exports = [...(list.exports ?? []), exportInfo]
  sendPdf(res, pdf, filename)
})

app.get('/api/pdf/service-confirmations/:id/:versionIndex', async (req, res) => {
  const item = serviceConfirmations.find(x => x._id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  const version = item.versions[Number(req.params.versionIndex || 0)]
  if (!version) return res.status(404).json({ error: 'Version not found' })
  const sequence = (item.exports?.length ?? 0) + 1
  const filename = `${(item.groupReference || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-service-confirmation-v${sequence}.pdf`
  const exportInfo = { _id: id(), sequence, label: `V${sequence}`, versionIndex: Number(req.params.versionIndex || 0), versionLabel: version.label, filename, kind: 'service-confirmation-pdf', exportedAt: new Date().toISOString() }
  const pdf = await renderPdf(buildServiceConfirmationHtml(item, version, exportInfo), { landscape: true })
  item.exports = [...(item.exports ?? []), exportInfo]
  sendPdf(res, pdf, filename)
})

app.get('/api/pdf/:id', async (req, res) => {
  const offer = offers.find(x => x._id === req.params.id)
  if (!offer) return res.status(404).json({ error: 'Not found' })

  const hydratedOffer = normalizeOffer(offer)
  const sequence = (offer.exports?.length ?? 0) + 1
  const filename = `${slug(hydratedOffer.company?.name || 'offer')}-offer-v${sequence}.pdf`
  const exportInfo = {
    _id: id(),
    sequence,
    label: `V${sequence}`,
    filename,
    kind: 'offer-pdf',
    exportedAt: new Date().toISOString(),
  }
  const pdf = await renderPdf(buildOfferHtml(hydratedOffer, exportInfo))
  offer.exports = [...(offer.exports ?? []), exportInfo]
  sendPdf(res, pdf, filename)
})

app.use(require('../http/errors'))
if (require.main === module) {
  const port = Number(process.env.PORT || 3001)
  app.listen(port, '127.0.0.1', () => console.log(`Offline demo: http://127.0.0.1:${port} — changes reset on restart`))
}
module.exports = app
