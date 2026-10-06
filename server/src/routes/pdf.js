const router = require('express').Router()
const puppeteer = require('puppeteer')
const fs = require('fs')
const Offer = require('../models/Offer')
const GuestList = require('../models/GuestList')
const ServiceConfirmation = require('../models/ServiceConfirmation')
const { buildOfferHtml, buildRoomingListHtml, buildServiceConfirmationHtml, slug } = require('../pdf/template')

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
    page.setDefaultNavigationTimeout(45000)
    await page.setContent(html, { waitUntil: 'load', timeout: 45000 })
    return await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, ...options })
  } finally {
    if (browser) await browser.close()
  }
}

function sendPdf(res, pdf, filename) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdf.length,
  })
  res.send(pdf)
}

function nextExportRecord(records, filename, extra = {}) {
  const sequence = (records?.length ?? 0) + 1
  return {
    sequence,
    label: `V${sequence}`,
    filename,
    exportedAt: new Date(),
    ...extra,
  }
}

router.get('/guest-lists/:id/:versionIndex', async (req, res) => {
  try {
    const list = await GuestList.findById(req.params.id).populate('company')
    if (!list) return res.status(404).json({ error: 'Guest list not found' })

    const versionIndex = Number(req.params.versionIndex || 0)
    const version = list.versions[versionIndex]
    if (!version) return res.status(404).json({ error: 'Guest list version not found' })

    const sequence = (list.exports?.length ?? 0) + 1
    const filename = `${slug(list.company?.name || 'company')}-${slug(list.name)}-rooming-list-v${sequence}.pdf`
    const exportInfo = nextExportRecord(list.exports, filename, {
      kind: 'rooming-list-pdf',
      versionIndex,
      versionLabel: version.label,
    })
    const html = buildRoomingListHtml(list.toObject(), version.toObject ? version.toObject() : version, exportInfo)
    const pdf = await renderPdf(html)

    list.exports.push(exportInfo)
    await list.save()

    sendPdf(res, pdf, filename)
  } catch (err) {
    console.error('Rooming list PDF error:', err)
    res.status(500).json({ error: err.message || 'Rooming list PDF generation failed' })
  }
})

router.get('/service-confirmations/:id/:versionIndex', async (req, res) => {
  try {
    const item = await ServiceConfirmation.findById(req.params.id).populate('company')
    if (!item) return res.status(404).json({ error: 'Service confirmation not found' })

    const versionIndex = Number(req.params.versionIndex || 0)
    const version = item.versions[versionIndex]
    if (!version) return res.status(404).json({ error: 'Service confirmation version not found' })

    const sequence = (item.exports?.length ?? 0) + 1
    const filename = `${slug(item.groupReference || item.name)}-service-confirmation-v${sequence}.pdf`
    const exportInfo = nextExportRecord(item.exports, filename, {
      kind: 'service-confirmation-pdf',
      versionIndex,
      versionLabel: version.label,
    })
    const html = buildServiceConfirmationHtml(item.toObject(), version.toObject ? version.toObject() : version, exportInfo)
    const pdf = await renderPdf(html)

    item.exports.push(exportInfo)
    await item.save()

    sendPdf(res, pdf, filename)
  } catch (err) {
    console.error('Service confirmation PDF error:', err)
    res.status(500).json({ error: err.message || 'Service confirmation PDF generation failed' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('company')
      .populate('people')
      .populate('template')
      .populate('days.destinations')

    if (!offer) return res.status(404).json({ error: 'Offer not found' })

    const sequence = (offer.exports?.length ?? 0) + 1
    const filename = `${slug(offer.company?.name || 'offer')}-offer-v${sequence}.pdf`
    const exportInfo = nextExportRecord(offer.exports, filename, { kind: 'offer-pdf' })
    const html = buildOfferHtml(offer.toObject(), exportInfo)
    const pdf = await renderPdf(html)

    offer.exports.push(exportInfo)
    await offer.save()

    sendPdf(res, pdf, filename)
  } catch (err) {
    console.error('PDF error:', err)
    res.status(500).json({ error: err.message || 'PDF generation failed' })
  }
})

module.exports = router
