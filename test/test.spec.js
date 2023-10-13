'use strict'
import DirigeraHub from '../index.mjs'
import fs from 'node:fs/promises'
import https from 'node:https'
import { resolve, join } from 'node:path'
import assert from 'node:assert'

const __dirname = resolve()

let fakeHubReady = false

async function promiseTimeout(delay) {
  console.log('promiseTimeout called waiting for', delay, 'ms')
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function startHub(params) {
  const privateKey = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'key.pem'), 'utf8')
  const certificate = await fs.readFile(join(__dirname, 'test', 'hubResponse', 'cert.pem'), 'utf8')
  const credentials = { key: privateKey, cert: certificate }

  const server = https.createServer(credentials, async (req, res) => {
    const requestedPath = new URL(req.url, `https://${req.headers.host}`).pathname
    const authHeader = req.headers.authorization
    if (!authHeader) console.log('Request has no authHeader')
    console.log('HUB: requestedPath', requestedPath)
    const responseWithJSON = ['devices', 'users/me', 'scenes', 'users', 'home']
    if (requestedPath === '/') {
      // Handle the root path
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Hello, this is the root path.')
    } else if (requestedPath === '/v1') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Hello, this is the root path of API v1.')
    } else if (responseWithJSON.includes(requestedPath.slice(4))) {
      try {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        const filePath = join(__dirname, 'test', 'hubResponse', requestedPath.slice(4) + '.json')
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
    fakeHubReady = true
  })
}

startHub()


async function startTest() {
  while (fakeHubReady == false) {
    await promiseTimeout(300)
  }
  const accessToken = 'fakeToken'
  const dirigeraHub = new DirigeraHub({ hubAddress: 'localhost', debug: 0, access_token: accessToken, clientName: 'test-node-dirigera' })
  const deviceData = await dirigeraHub.getDevice()
  const deviceDataExpected = [
    {
      id: '265fb74f-544b-4f09-1234-765a5f411aa1_1',
      type: 'blinds',
      deviceType: 'blinds',
      createdAt: '2023-09-30T14:37:14.000Z',
      isReachable: true,
      lastSeen: '2023-10-10T14:36:59.000Z',
      attributes: {
        customName: 'Blind no 1',
        model: 'PRAKTLYSING cellular blind',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '24.4.13',
        hardwareVersion: '1',
        serialNumber: '4C5BB3FAAAA74',
        productCode: 'E2021',
        batteryPercentage: 67,
        blindsTargetLevel: 0,
        blindsCurrentLevel: 0,
        blindsState: 'stopped',
        permittingJoin: false,
        otaStatus: 'upToDate',
        otaState: 'readyToCheck',
        otaProgress: 0,
        otaPolicy: 'autoUpdate',
        otaScheduleStart: '00:00',
        otaScheduleEnd: '00:00'
      },
      capabilities: {
        canSend: [], canReceive: ['customName',
        'blindsCurrentLevel',
        'blindsTargetLevel',
        'blindsState' ]},
      room: {
        id: '98694611-70fd-44c5-1234-685d8347eb1d',
        name: 'room 1',
        color: 'ikea_green_no_65',
        icon: 'rooms_cutlery'
      },
      deviceSet: [],
      remoteLinks: ['a578dfac-716c-43e6-1234-107cb6b9dcdf_1'],
      isHidden: false
    }
  ]
  assert.deepStrictEqual(deviceData, deviceDataExpected)

  const roomData = await dirigeraHub.getTypeInRoom()
  const roomDataExpected = { blinds: ['room 1'] }
  assert.deepStrictEqual(roomData, roomDataExpected)

  console.log('Module tests done. All good. Reach end of test')
  process.exit()
}

startTest()