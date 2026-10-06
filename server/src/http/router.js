const express = require('express')
module.exports = function createRouter() {
  const router = express.Router()
  for (const method of ['get', 'post', 'put', 'delete']) {
    const register = router[method].bind(router)
    router[method] = (path, handler) => register(path, (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next))
  }
  return router
}
