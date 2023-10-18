import https from 'https'
import fs from 'fs/promises'
import { resolve, join } from 'path'
import querystring from 'querystring'

const __dirname = resolve()

/** fakeHub
 * @param {number} debugLvl
 * @returns
 */
async function fakeHub (debugLvl) {
  const fakeHubStore = {
    authorizeActive: false,
    waitForPush: -1,
    timer: null,
    waitForPushMax: 3
  }
  const debugLevel = debugLvl || 0
  fakeHubStore.authorizeActive = false
  const privateKey = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'key.pem'), 'utf8')
  const certificate = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'cert.pem'), 'utf8')
  return new Promise((resolve, reject) => {
    const credentials = { key: privateKey, cert: certificate }
    function getBody (request) {
      return new Promise((resolve) => {
        const bodyParts = []
        let body
        request.on('data', (chunk) => {
          bodyParts.push(chunk)
        }).on('end', () => {
          body = Buffer.concat(bodyParts).toString()
          resolve(body)
        })
      })
    }
    const server = https.createServer(credentials, async (req, res) => {
      const url = new URL(req.url, `https://${req.headers.host}`)
      let queryData = {}
      if (req.method === 'GET') {
        queryData = Object.fromEntries(url.searchParams.entries())
      }
      if (Object.keys(queryData).length && debugLevel > 2) console.log('HUB: queryData', JSON.stringify(queryData))
      const body = await getBody(req)
      if (body && debugLevel > 3) console.log('HUB: incoming body: ', body)
      const requestedPath = url.pathname
      const authHeader = req.headers.authorization
      if (!authHeader) {
        if (!requestedPath.match(/\/v1\/oauth\//)) {
          console.warn('HUB: Request has no authHeader')
        }
      } else if (authHeader !== 'Bearer fakebGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRlN2RmNmFiYTYwMTM2ZDcyNmRjMWIyfakeMzUwODA1ZGRlOTc3OTY1OTU4Njg0OGMzNmRlMzY2YjhhM2YwNDcifQ.eyJpc3MiOiI5Yjc2YTI4Zi1mMjk5LTQ2OWEtODg0NC1iZWYyM2NmM2Q3NWUiLCJ0eXBlIjoifakeZXNzIiwiYXVkIjoiaG9tZXNtYXJ0LmxvY2FsIiwic3ViIjoiNTU5NWI3ZDAtN2Q3Ni00YjI1LThjODItODNjZmI2MmY0Mjc1IiwiaWF0IjoxNjk3MzkzMDk5LCJleHAiOjIwMTI5NjkwOTl9.c8W087nMe_WNxKzHN_HQ8iE12u9AW8bd6J3fPp3spnS54nUKN_fake6gBwAR5KqWZzNfOlXeb7Tuvahk1JqCww') {
        console.error('HUB: Request authHeader is wrong!')
      }
      if (debugLevel > 0) console.log('HUB: requestedPath', req.method, requestedPath)
      const responseWithJSON = ['devices', 'users/me', 'scenes', 'users', 'home']
      if (requestedPath === '/') {
        // Handle the root path
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('Hello, this is the root path.')
      } else if (requestedPath === '/v1') {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('Hello, this is the root path of API v1.')
      } else if (req.method === 'GET' && responseWithJSON.includes(requestedPath.slice(4))) {
        try {
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          const filePath = join(__dirname, 'test', 'hubResponse', 'get', requestedPath.slice(4) + '.json')
          const data = await fs.readFile(filePath)
          res.end(data)
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          const errorMessage = 'Not Found. Should have been there: ' + requestedPath.slice(4) + '.json'
          console.warn('HUB: ' + errorMessage)
          res.end(errorMessage)
        }
      } else if (req.method === 'GET' && requestedPath.match(/^\/v1\/oauth\/authorize?/)) {
        // This part is when authorization is just starting
        if (debugLevel > 1) console.log('HUB: authorize started')
        if (fakeHubStore.authorizeActive === true) {
          res.writeHead(409, { 'Content-Type': 'text/plain' })
          const errorMessage = 'Already one ongoing pairing request'
          console.warn('HUB: ' + errorMessage)
          res.end(errorMessage)
          return
        }
        const failedChecks = []
        if (queryData.audience !== 'homesmart.local') failedChecks.push('Query must contain audience=homesmart.local not:' + String(queryData.audience))
        if (queryData.response_type !== 'code') failedChecks.push('Query must contain response_type=code not:' + String(queryData.response_type))
        if (queryData.challenge_method !== 'S256') failedChecks.push('Query must contain challenge_method=S256 not:' + String(queryData.challenge_method))
        if (!queryData.code_challenge || queryData.code_challenge.length < 20) failedChecks.push('Query must contain code_challenge=a string longer then 20 not:' + String(queryData.code_challenge))
        if (failedChecks.length === 0) {
          fakeHubStore.authorizeActive = true
          fakeHubStore.waitForPush = fakeHubStore.waitForPushMax
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end('{"code":"0b510398-fake-4dcc-fake-8f09c245ca5f"}')
        } else {
          // TODO Get the real error message when giving wrong format
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          console.warn('HUB', failedChecks)
          res.end(failedChecks.join(', '))
        }
      } else if (req.method === 'POST' && requestedPath === '/v1/oauth/token') {
        // This part is when waiting for button press on Dirigera hub
        if (fakeHubStore.authorizeActive !== true) {
          // TODO Get the real error message when already one token is active and waiting for button push
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          const errorMessage = 'cant request token if not authorize action is started'
          console.warn('HUB: ' + errorMessage)
          res.end(errorMessage)
          return
        }
        const bodyQuery = querystring.parse(body)
        const failedChecks = []
        if (bodyQuery.code !== '0b510398-fake-4dcc-fake-8f09c245ca5f') failedChecks.push('Body query string contains wrong code')
        if (!bodyQuery.name) failedChecks.push('Body query string is missing name')
        if (bodyQuery.grant_type !== 'authorization_code') failedChecks.push('Body query string is missing grant_type=authorization_code')
        if (!bodyQuery.code_verifier) failedChecks.push('Body query string is missing a code_verifier')
        if (failedChecks.length) {
          // TODO Get the real error message when giving wrong format
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          console.warn('HUB: ' + failedChecks)
          // res.end({ error: failedChecks.join(', ') })
          res.end(failedChecks.join(', '))
          return
        }
        if (fakeHubStore.waitForPush > 0) {
          // This is a fake waiting step to imitate waiting for a button push
          // Either request status 3 times or wait 20 seconds
          // Then the fake button will be pressed
          if (fakeHubStore.waitForPush === fakeHubStore.waitForPushMax) {
            fakeHubStore.timer = setTimeout(() => { fakeHubStore.waitForPush = 0 }, 20000)
          }
          fakeHubStore.waitForPush--
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end('{"error":"Button not pressed or presence time stamp timed out."}')
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end('{"access_token":"fakebGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRlN2RmNmFiYTYwMTM2ZDcyNmRjMWIyfakeMzUwODA1ZGRlOTc3OTY1OTU4Njg0OGMzNmRlMzY2YjhhM2YwNDcifQ.eyJpc3MiOiI5Yjc2YTI4Zi1mMjk5LTQ2OWEtODg0NC1iZWYyM2NmM2Q3NWUiLCJ0eXBlIjoifakeZXNzIiwiYXVkIjoiaG9tZXNtYXJ0LmxvY2FsIiwic3ViIjoiNTU5NWI3ZDAtN2Q3Ni00YjI1LThjODItODNjZmI2MmY0Mjc1IiwiaWF0IjoxNjk3MzkzMDk5LCJleHAiOjIwMTI5NjkwOTl9.c8W087nMe_WNxKzHN_HQ8iE12u9AW8bd6J3fPp3spnS54nUKN_fake6gBwAR5KqWZzNfOlXeb7Tuvahk1JqCww"}')
        fakeHubStore.authorizeActive = false
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
    })
  })
}

export {
  fakeHub
}

export default fakeHub
