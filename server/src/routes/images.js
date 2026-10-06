const router = require('../http/router')()

const DIRECT_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'plus.unsplash.com',
])

const UNSPLASH_PAGE_HOSTS = new Set([
  'unsplash.com',
  'www.unsplash.com',
])

const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i

function normalizeDirectImageUrl(value) {
  const url = new URL(value)
  if (DIRECT_IMAGE_HOSTS.has(url.hostname)) {
    if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
    if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'crop')
    if (!url.searchParams.has('w')) url.searchParams.set('w', '1400')
    if (!url.searchParams.has('q')) url.searchParams.set('q', '85')
  }
  return url.toString()
}

function isDirectImage(value) {
  const url = new URL(value)
  return DIRECT_IMAGE_HOSTS.has(url.hostname) || IMAGE_EXTENSION.test(url.pathname)
}

function extractMetaImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1].replace(/&amp;/g, '&')
  }
  return ''
}

router.post('/resolve', async (req, res) => {
  try {
    const raw = String(req.body?.url ?? '').trim()
    if (!raw) return res.status(400).json({ error: 'Image URL is required' })

    const input = new URL(raw)
    if (!['http:', 'https:'].includes(input.protocol)) {
      return res.status(400).json({ error: 'Use an http or https image URL' })
    }

    if (isDirectImage(input.toString())) {
      return res.json({ url: normalizeDirectImageUrl(input.toString()) })
    }

    if (!UNSPLASH_PAGE_HOSTS.has(input.hostname)) {
      return res.status(400).json({
        error: 'That link is not a direct image. Use "Copy image address", an Unsplash photo page, or upload a file.',
      })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(input.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Tours image resolver' },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(400).json({ error: 'Could not read that image page' })
    }

    const html = await response.text()
    const imageUrl = extractMetaImage(html)
    if (!imageUrl) {
      return res.status(400).json({ error: 'Could not find an image on that page' })
    }

    res.json({ url: normalizeDirectImageUrl(new URL(imageUrl, input).toString()) })
  } catch (err) {
    res.status(400).json({ error: 'Could not resolve that image URL' })
  }
})

module.exports = router
