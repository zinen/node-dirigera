import https from 'https'
import fs from 'fs/promises'
import { resolve, join } from 'path'

const __dirname = resolve()

async function fakeHub () {
  return new Promise(async (resolve, reject) => {
  const privateKey = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'key.pem'), 'utf8')
  const certificate = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'cert.pem'), 'utf8')
  const credentials = { key: privateKey, cert: certificate }

  const server = https.createServer(credentials, async (req, res) => {
    const requestedPath = new URL(req.url, `https://${req.headers.host}`).pathname
    const authHeader = req.headers.authorization
    if (!authHeader) console.log('Request has no authHeader')
    console.log('HUB: requestedPath',req.method, requestedPath)
    const responseWithJSON = ['devices', 'users/me', 'scenes', 'users', 'home']
    if (requestedPath === '/') {
      // Handle the root path
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Hello, this is the root path.')
    } else if (requestedPath === '/v1') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Hello, this is the root path of API v1.')
    } else if (req.method == 'GET' && responseWithJSON.includes(requestedPath.slice(4))) {
      try {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        const filePath = join(__dirname, 'test', 'hubResponse', 'get',requestedPath.slice(4) + '.json')
        const data = await fs.readFile(filePath)
        res.end(data)
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        const errorMessage = 'Not Found. Should have been there: ' + requestedPath.slice(4) + '.json'
        console.warn(errorMessage)
        res.end(errorMessage)
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  })

  const port = 8443
  server.listen(port, () => {
    console.log(`HUB: is running on https://localhost:${port}`)
    resolve()
  })
  server.on('error', (e) => {
    reject(e)
  });
  
})
}

export {
  fakeHub
}

export default fakeHub