const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const app = require('../src/demo')
const { buildOfferHtml, buildRoomingListHtml } = require('../src/pdf/template')
let server, base
before(async () => {
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => { await new Promise(resolve => server.close(resolve)) })
const json = async (path, options) => { const res = await fetch(base + path, options); return { status: res.status, data: await res.json() } }
test('health identifies memory-only demo', async () => {
  const { data } = await json('/api/health')
  assert.equal(data.mode, 'offline-demo'); assert.equal(data.persistence, 'memory')
})
test('offer responses hydrate relationships', async () => {
  const { status, data } = await json('/api/offers/o1')
  assert.equal(status, 200); assert.equal(data.company.name, 'Cedar Demo Travel')
  assert.equal(data.people[0].name, 'Alex Demo'); assert.equal(data.days[0].destinations[0].name, 'AlUla')
})
test('company create, update and delete round trip', async () => {
  const opts = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const created = await json('/api/companies', opts('POST', { name: 'Test Company' }))
  assert.equal(created.status, 201)
  const changed = await json('/api/companies/' + created.data._id, opts('PUT', { name: 'Updated Company' }))
  assert.equal(changed.data.name, 'Updated Company')
  await json('/api/companies/' + created.data._id, { method: 'DELETE' })
  const list = await json('/api/companies'); assert.ok(!list.data.some(x => x._id === created.data._id))
})
test('missing offers and versions return 404', async () => {
  for (const path of ['/api/offers/absent', '/api/pdf/absent', '/api/pdf/guest-lists/g1/99', '/api/pdf/service-confirmations/s1/99']) {
    assert.equal((await json(path)).status, 404)
  }
})
test('rooming list preserves fictional guests and company relation', async () => {
  const { data } = await json('/api/guest-lists/g1')
  assert.equal(data.company.name, 'Cedar Demo Travel'); assert.equal(data.versions[0].guests.length, 2)
})
test('HTML builders escape user-controlled text', () => {
  const html = buildOfferHtml({ company: { name: '<script>alert(1)</script>' }, days: [], people: [], options: [] })
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'))
  const room = buildRoomingListHtml({ name: '<b>unsafe</b>' }, { guests: [{ fullName: '<img src=x onerror=alert(1)>' }] })
  assert.ok(!room.includes('<img src=x')); assert.ok(room.includes('&lt;img'))
})
for (const path of ['/api/pdf/o1', '/api/pdf/guest-lists/g1/0', '/api/pdf/service-confirmations/s1/0']) {
  test(`renders a real PDF: ${path}`, { timeout: 60000 }, async () => {
    const res = await fetch(base + path)
    assert.equal(res.status, 200); assert.match(res.headers.get('content-type'), /application\/pdf/)
    const bytes = Buffer.from(await res.arrayBuffer())
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-'); assert.ok(bytes.length > 1000)
  })
}
test('invalid input is rejected and identity cannot be overwritten', async () => {
 const opts = body => ({method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
 assert.equal((await json('/api/companies/c1',opts({name:''}))).status,400)
 const updated = await json('/api/companies/c1',opts({_id:'changed',name:'Cedar Demo Travel'}))
 assert.equal(updated.data._id,'c1')
 assert.equal((await json('/api/offers/o1',opts({options:[{label:'Bad',price:-1}]}))).status,400)
})
test('failed PDF rendering does not add export history', async t => {
 const puppeteer = require('puppeteer')
 t.mock.method(puppeteer,'launch',async () => { throw new Error('Simulated browser failure') })
 for (const [record,pdf] of [['/api/offers/o1','/api/pdf/o1'],['/api/guest-lists/g1','/api/pdf/guest-lists/g1/0'],['/api/service-confirmations/s1','/api/pdf/service-confirmations/s1/0']]) {
  const before = (await json(record)).data.exports.length
  assert.equal((await json(pdf)).status,500)
  assert.equal((await json(record)).data.exports.length,before)
 }
})
