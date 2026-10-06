const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server-core')
const app = require('../src')
let mongo, server, base
before(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri(), { dbName: 'travel_test' })
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  base = `http://127.0.0.1:${server.address().port}/api`
}, { timeout: 600000 })
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (mongo) await mongo.stop() })
const request = async (path, method = 'GET', body) => {
 const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
 return { status: res.status, data: await res.json() }
}
test('MongoDB persists CRUD, validates updates, and returns clear missing-record errors', async () => {
 const created = await request('/companies', 'POST', { name: 'Database Demo' })
 assert.equal(created.status, 201)
 const key = created.data._id
 assert.equal((await request('/companies/'+key, 'PUT', { name: '' })).status, 400)
 assert.equal((await request('/companies/'+key, 'PUT', { name: 'Updated Demo' })).data.name, 'Updated Demo')
 assert.ok((await request('/companies')).data.some(x => x.name === 'Updated Demo'))
 assert.equal((await request('/companies/'+key, 'DELETE')).status, 200)
 assert.equal((await request('/companies/'+key, 'PUT', { name: 'Gone' })).status, 404)
 assert.equal((await request('/companies/'+key, 'DELETE')).status, 404)
 assert.equal((await request('/offers/'+key)).status, 404)
 assert.equal((await request('/people/not-an-object-id', 'PUT', { name: 'Demo' })).status, 400)
})
test('MongoDB hydrates offer references and protects export history', async () => {
 const company = (await request('/companies','POST',{name:'Offer Demo'})).data
 const person = (await request('/people','POST',{name:'Alex Demo',email:'alex@example.com'})).data
 const offer = (await request('/offers','POST',{company:company._id, people:[person._id], options:[], exports:[{sequence:99}]})).data
 const fetched = await request('/offers/'+offer._id)
 assert.equal(fetched.data.company.name,'Offer Demo'); assert.equal(fetched.data.people[0].name,'Alex Demo')
 assert.equal(fetched.data.exports.length,0)
 const changed = await request('/offers/'+offer._id,'PUT',{status:'Unknown'})
 assert.equal(changed.status,400)
 assert.equal((await request('/offers/'+offer._id,'PUT',{options:[{label:'Bad',price:-1}]})).status,400)
})
test('MongoDB gives rooming and service versions persistent identities', async () => {
 for (const [path, body] of [['/guest-lists',{name:'Demo list',type:'Group',versions:[{label:'V1',status:'Draft',guests:[]}]}],['/service-confirmations',{name:'Demo services',versions:[{label:'V1',status:'Draft',days:[]}]}]]) {
  const created = await request(path,'POST',body); assert.equal(created.status,201)
  assert.ok(created.data.versions[0]._id)
  assert.equal((await request(path+'/'+created.data._id)).data.versions[0]._id,created.data.versions[0]._id)
 }
})
