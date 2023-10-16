'use strict'
const fetch = require('node-fetch')
const os = require('node:os')
const crypto = require('node:crypto')
const https = require('node:https')

class DirigeraError extends Error {
  constructor(message, request = null) {
    super(message)
    this.name = 'DirigeraError'
    if (request) this.responseStatus = request.status
    // Capture the stack trace
    Error.captureStackTrace(this, DirigeraError)
  }
}

/**
 * @class DirigeraHub
 * options: hubAddress,access_token,clientName,debug
 * @param {object} options with:
 * @param {string} hubAddress String with ip/dns of hub
 * @param {string} access_token 
 * @param {string} clientName 
 * @param {number} debug number 0-5 debug level
 */
class DirigeraHub {
  #bearerToken
  options = {}
  constructor(options) {
    const errors = []
    if (options.hubAddress) {
      this.options.hubAddress = options.hubAddress
    } else {
      errors.push('The input for hubAddress is empty. Fill in ip/DNS/hostname of hub.')
    }
    if (options.access_token) this.#bearerToken = String(options.access_token)
    // console.log(this.#bearerToken)
    this.options.clientName = options.clientName ? String(options.clientName) : os.hostname()
    if (typeof options.debug === 'number' && options.debug >= 0 && options.debug <= 5) {
      this.options.debug = options.debug ? options.debug : 0
    } else { errors.push('Input for debug should be number in range 0-5.') }
    if (errors.length) throw new Error(errors.join('; '))
    this.loggedIn = false
    this.data = { devicesRawTimeout: 0 }
  }

  promiseTimeout(delay) {
    if (this.options.debug > 2) console.log('promiseTimeout called waiting for', delay, 'ms')
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  #httpsAgent = new https.Agent({
    rejectUnauthorized: false
  })

  async waitForButtonPress(dirigeraResponseCode, dirigera128Code) {
    if (this.options.debug > 2) console.log('running waitForButtonPress')
    let buttonPressed = false
    let lastRequest = null
    let counter = 0
    const payload = {
      code: dirigeraResponseCode,
      name: this.options.clientName,
      grant_type: 'authorization_code',
      code_verifier: dirigera128Code
    }
    while (!buttonPressed) {
      await this.promiseTimeout(1500)
      lastRequest = await fetch('https://' + this.options.hubAddress + ':8443/v1/oauth/token',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          agent: this.#httpsAgent,
          method: 'POST',
          body: new URLSearchParams(payload)
        }
      )
      if (String(lastRequest.status).match(/2\d\d/)) {
        buttonPressed = true
        break
      } else if (lastRequest.status !== 403) {
        let response
        try {
          response = (await lastRequest.json()).error
        } catch {
          response = await lastRequest.text()
        }
        throw new DirigeraError(`Error while waiting for button press on hub. Status code: ${lastRequest.status}. Response: ${response}`, lastRequest)
      }
      // else {
      //   console.log('Waiting for button press on Dirigera hub')
      // }
      if (counter > 45) break
      counter++
    }
    if (buttonPressed) {
      // console.log('Button pressed on Dirigera hub')
      this.#bearerToken = (await lastRequest.json()).access_token
      return this.#bearerToken
    } else {
      throw new DirigeraError('Button was not pressed within time', lastRequest)
    }
  }

  generateRandomLetter() {
    const CodeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    return CodeAlphabet[Math.floor(Math.random() * CodeAlphabet.length)]
  }

  getCodeVerifier() {
    const CodeLength = 128
    let s = ''
    for (let i = 0; i < CodeLength; i++) {
      s += this.generateRandomLetter()
    }
    return s
  }

  async getAccessToken() {
    if (this.options.debug > 2) console.log('running getAccessToken')
    const dirigera128Code = this.getCodeVerifier()
    const payload = {
      audience: 'homesmart.local',
      response_type: 'code',
      code_challenge: crypto.createHash('sha256').update(dirigera128Code).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'),
      challenge_method: 'S256'
    }
    const URL = 'https://' + this.options.hubAddress + ':8443/v1/oauth/authorize?' + new URLSearchParams(payload)
    if (this.options.debug > 3) console.log('getAccessToken URL:', URL)
    const response = await fetch(URL,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        agent: this.#httpsAgent
      }
    )
    if (!String(response.status).match(/2\d\d/)) {
      let responseValue = ''
      try {
        responseValue = (await response.json()).error
      } catch {
        responseValue = await response.text()
      }
      throw new DirigeraError(`Error contacting hub during establishing contact. Status code: ${response.status}. Response: ${responseValue}`, response)
    }
    const response2 = await response.json()
    if (!response2.code) throw new Error('The hub response missed an authentication code in response')
    // holder.DirigeraResponseCode = holder.response.code
    const token = await this.waitForButtonPress(response2.code, dirigera128Code)
    await this.logIn()
    return token
  }

  async fetch(endUrl, bypassLoginCheck = false, method = 'GET', body = {}) {
    const URL = 'https://' + this.options.hubAddress + ':8443/v1/' + endUrl
    if (!this.loggedIn && !bypassLoginCheck) await this.logIn()
    if (this.options.debug > 3) console.log('running fetch ' + method + ' on URL: ' + URL)
    if (!(['GET', 'POST', 'PUT', 'PATCH'].includes(method))) throw new Error(`Unknown web request method: ${method}. Default is GET`)
    const payload = {
      headers: { Authorization: 'Bearer ' + this.#bearerToken },
      agent: this.#httpsAgent,
      method
    }
    if (method !== 'GET') {
      payload.headers['Content-Type'] = 'application/json'
      payload.body = JSON.stringify(body)
      if (this.options.debug > 4) console.log('Body: ', payload.body)
    }
    const response = await fetch(URL, payload)
    if (this.options.debug > 4 && response.headers) {
      console.log('Returned headers response:' + String(response.status))
      response.headers.forEach((value, name) => {
        console.log(`- ${name}: ${value}`)
      })
    }
    if (!String(response.status).match(/2\d\d/)) {
      const contentType = response.headers.get('content-type')
      let responseValue = ''
      if (contentType.includes('application/json')) {
        try {
          const error = await response.json()
          if (this.options.debug > 4) console.log('Response error: ', error)
          responseValue = error.message || error.error || error
          if (!responseValue) throw new Error()
        } catch {
          responseValue = await response.text()
        }
      } else {
        responseValue = await response.text()
      }
      throw new DirigeraError(`Error requesting hub data. Status code: ${response.status}. Response: ${responseValue}`, response)
    }
    return response
  }

  async logIn() {
    if (this.options.debug > 4) console.log('running logIn')
    if (!this.#bearerToken) throw new DirigeraError('No access token found. Run getAccessToken to get one.')
    const response = await this.fetch('users/me', true)
    if (!String(response.status).match(/2\d\d/)) throw new DirigeraError('Login failed', response)
    this.loggedIn = true
    return true
  }

  parseDevices(devicesRaw) {
    if (!devicesRaw) return null
    const devicesParsed = {}
    for (const device of devicesRaw) {
      if (device.type === 'gateway') continue

      if (!Object.prototype.hasOwnProperty.call(devicesParsed, device.type)) {
        devicesParsed[device.type] = {}
      }
      if (!Object.prototype.hasOwnProperty.call(devicesParsed[device.type], device.room.name)) {
        devicesParsed[device.type][device.room.name] = {
          canReceive: device.capabilities.canReceive,
          list: [],
          id: device.room.id
        }
      }
      const newIndex = devicesParsed[device.type][device.room.name].list.push({
        id: device.id,
        name: device.attributes.customName,
        createdAt: device.createdAt,
        isReachable: device.isReachable,
        lastSeen: device.lastSeen
      })
      if (Object.prototype.hasOwnProperty.call(device.attributes, 'batteryPercentage')) {
        devicesParsed[device.type][device.room.name].list[newIndex - 1].batteryPercentage = device.attributes.batteryPercentage
      }
      if (device.capabilities.canReceive) {
        device.capabilities.canReceive.forEach(element => {
          if (Object.prototype.hasOwnProperty.call(device.attributes, element)) {
            devicesParsed[device.type][device.room.name].list[newIndex - 1][element] = device.attributes[element]
          }
        })
      }
    }
    return devicesParsed
  }

  async getDevice(targetId = null, forceNewValues = false) {
    if (this.options.debug > 2) console.log('running getDevice')
    const now = Number(new Date())
    if (now > this.data.devicesRawTimeout || forceNewValues) {
      const response = await this.fetch('devices')
      this.data.devices = await response.json()
      this.data.devicesRawTimeout = Number(new Date()) + 3000
    }
    if (!targetId) return this.data.devices
    for (const iterator of this.data.devices) {
      if (iterator.id === targetId || (iterator.attributes && iterator.attributes.customName && iterator.attributes.customName === targetId)) {
        return iterator
      }
    }
    throw new Error(`Device Id ${targetId} not found`)
  }

  async setDevice(targetId, attribute, value) {
    if (this.options.debug > 2) console.log('running setDevice')
    let found = false
    for (const iterator of await this.getDevice()) {
      if (iterator.id === targetId || (iterator.attributes && iterator.attributes.customName && iterator.attributes.customName === targetId)) {
        if (iterator.attributes[attribute] !== undefined && typeof iterator.attributes[attribute] !== typeof value) throw new Error(`Device Id ${targetId} cant receive ${attribute} of type ${typeof value} should be ${typeof iterator.attributes[attribute]}`)
        found = iterator.capabilities.canReceive.includes(attribute)
        break
      }
    }
    if (!found) throw new Error(`Device Id ${targetId} cant receive ${attribute}`)
    return this.fetch('devices/' + targetId, false, 'PATCH', [{ attributes: { [attribute]: value } }])
  }

  async getRoom(targetId, type = null) {
    const devices = []
    for (const iterator of await this.getDevice()) {
      if (iterator.room && (iterator.room.id === targetId || iterator.room.name === targetId) && (type === null || iterator.type === type)) {
        if (this.options.debug > 2) console.log('- Match: ' + iterator.attributes.customName)
        devices.push(iterator)
      }
    }
    if (devices.length === 0) throw new Error('getRoom cant find room name or id: ' + String(targetId))
    return devices
  }

  async setRoom(targetId, attribute, value, type = null) {
    if (this.options.debug > 2) console.log('running setRoom on ' + targetId + ' to modify ' + attribute + '. Optional type requirement=' + type)
    const devices = []
    for (const iterator of await this.getRoom(targetId, type)) {
      devices.push(this.setDevice(iterator.id, attribute, value).catch(error => ({ status: 'rejected', reason: error })))
    }
    const payback = { ok: [], errors: [] }
    const allDone = await Promise.allSettled(devices)
    for (const result of allDone) {
      if (result.value.status === 'rejected') {
        payback.errors.push(String(result.value.reason))
      } else {
        const lastIndex = result.value.url.lastIndexOf('/')
        payback.ok.push(result.value.url.slice(lastIndex + 1))
      }
    }
    return payback
  }

  async getTypeInRoom() {
    if (this.options.debug > 2) console.log('running getTypeInRoom')
    const result = {}
    for (const device of (await this.getDevice())) {
      if (device.type === 'gateway') continue

      if (!Object.prototype.hasOwnProperty.call(result, device.type)) {
        result[device.type] = [device.room.name]
      } else if (!result[device.type].includes(device.room.name)) {
        result[device.type].push(device.room.name)
        result[device.type].sort()
      }
    }
    return result
  }

  async getScenes() {
    if (this.options.debug > 3) console.log('running getScenes')
    const response = await this.fetch('scenes')
    const data = await response.json()
    return data
  }

  async get(urlEnd) {
    if (this.options.debug > 3) console.log('running get')
    const response = await this.fetch(urlEnd)
    const data = await response.json()
    return data
  }

  async put(urlEnd, body) {
    if (this.options.debug > 3) console.log('running put')
    const response = await this.fetch(urlEnd, false, 'PUT', body)
    const data = await response.text()
    return data
  }

  async post(urlEnd, body) {
    if (this.options.debug > 2) console.log('running POST')
    const response = await this.fetch(urlEnd, false, 'POST', body)
    const data = await response.text()
    return data
  }
}

module.exports = DirigeraHub
