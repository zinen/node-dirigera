"use strict"
import fetch from "node-fetch"
import os from 'node:os'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import https from 'node:https'

const holder = {}

console.log('Starting')
holder.clientName = os.hostname()
console.log('Client', holder.clientName)


async function dotEnvMini () {
  let data = await fs.readFile('.env', { encoding: 'utf8' })
  data = data.split(/\r?\n/)
  for (const line of data) {
    if (line.trim()[0] === '#') continue
    const [key, value] = line.split('=')
    if (value === undefined) continue
    process.env[key.trim()] = value.trim()
  }
}


const CodeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
const CodeLength = 128
function generateRandomLetter() {
  return CodeAlphabet[Math.floor(Math.random() * CodeAlphabet.length)]
}

class DirigeraHub {
  constructor(options) {
    const errors = []
    if (this.options.hubAddress) {
      this.options.hubAddress = options.hubAddress
    } else {
      errors.push('The input for hubAddress is empty. Fill in ip for hostname for hub')
    }
    if (errors) throw new Error(errors.join('; '))
  }

}


function getCodeVerifier() {
  let s = ""
  for (let i = 0; i < CodeLength; i++) {
    s += generateRandomLetter()
  }
  return s
}

async function promiseTimeout(delayMs) {
  // if (this.options.debug > 2) console.log('promiseTimeout called waiting for', delay, 'ms, waiting requests:', this.requestQueue)
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});


async function waitForButtonPress(params) {
  let buttonPressed = false
  let lastRequest = null
  let counter = 0
  holder.payload2 = {
    code: holder.DirigeraResponseCode,
    name: holder.clientName,
    grant_type: 'authorization_code',
    code_verifier: holder.Dirigera128Code
  }
  while (!buttonPressed) {
    await promiseTimeout(1500)
    lastRequest = await fetch('https://' + holder.hub + ':8443/v1/oauth/token',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        agent: httpsAgent,
        method: 'POST',
        body: new URLSearchParams(holder.payload2)
      }
    )
    // if (!String(response2.status).match(/2\d\d/)) throw new Error(`Error contacting ${holder.hub} during establishing contact. Response code was ${response2.status}`)
    // console.log('lastRequest.status', lastRequest.status)
    if (String(lastRequest.status).match(/2\d\d/)) {
      buttonPressed = true
      break
    } else if (String(lastRequest.status) != 403) {
      let response
      try {
        response = lastRequest.json().error
      } catch {
        response = lastRequest.text()
      }
      throw new DirigeraError(`Error while waiting for button press on hub. Status code: ${response.status}. Response: ${response}`, lastRequest)
    } else {
      console.log('Waiting for button press on Dirigera hub')
    }
    if (counter > 45) break
    counter++
  }
  if (buttonPressed) {
    console.log('Button pressed on Dirigera hub')
    holder.access_token = (await lastRequest.json()).access_token 
  } else {
    throw new DirigeraError('Button was not pressed within time', lastRequest)
  }
}


async function getAccessToken() {
  holder.Dirigera128Code = getCodeVerifier()
  holder.code_challenge = crypto.createHash('sha256').update(holder.Dirigera128Code).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  holder.payload = {}
  holder.payload.audience = "homesmart.local"
  holder.payload.response_type = "code"
  holder.payload.code_challenge = holder.code_challenge
  holder.payload.code_challenge_method = "S256"
  holder.rejectUnauthorized = false
  const response = await fetch('https://' + holder.hub + ':8443/v1/oauth/authorize?' + new URLSearchParams(holder.payload),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      agent: httpsAgent
    }
  )
  if (!String(response.status).match(/2\d\d/)) {
    let responseValue = ""
    try {
      responseValue = response.json().error
    } catch {
      responseValue = response.text()
    }
    throw new DirigeraError(`Error contacting hub during establishing contact. Status code: ${response.status}. Response: ${responseValue}`, response)
  }
  holder.response = await response.json()
  if (!holder.response.code) throw new Error(`The hub response missed an authentication code in response`)
  holder.DirigeraResponseCode = holder.response.code
  await waitForButtonPress()
}

async function getDevices() {
  const response = await fetch('https://' + holder.hub + ':8443/v1/devices',
    {
      headers: { 'Authorization': "Bearer " + holder.access_token },
      agent: httpsAgent
    }
  )
  if (!String(response.status).match(/2\d\d/)) {
    let responseValue = ""
    try {
      responseValue = response.json().error
    } catch {
      responseValue = response.text()
    }
    throw new DirigeraError(`Error requesting hub data. Status code: ${response.status}. Response: ${responseValue}`, response)
  }
  const devicesRaw = await response.json()

  const connectedDevices = {}
  for (const device of devicesRaw) {

    const deviceAttributes = {}
    if (device.type === 'controller' || device.type === 'gateway') continue
    const deviceType = device.type
    if (!connectedDevices.hasOwnProperty(deviceType)) {
      connectedDevices[deviceType] = []
    }
    deviceAttributes.id = device.id
    deviceAttributes.name = device.attributes.customName
    deviceAttributes.createdAt = device.createdAt
    deviceAttributes.isReachable = device.isReachable
    deviceAttributes.attributes = {}
    if (device.attributes.batteryPercentage) {
      deviceAttributes.batteryPercentage = device.attributes.batteryPercentage
    }
    if (device.attributes.blindsTargetLevel) {
      deviceAttributes.blindsTargetLevel = device.attributes.blindsTargetLevel
    }
    connectedDevices[deviceType].push(deviceAttributes);
  }
  holder.connectedDevices = connectedDevices
  await fs.writeFile('logs/connectedDevicesRaw.json', JSON.stringify(devicesRaw, null, 2))
  await fs.writeFile('logs/connectedDevices.json', JSON.stringify(connectedDevices, null, 2))
  return connectedDevices;
}

async function setDevice(id,value) {
  const response = await fetch('https://' + holder.hub + ':8443/v1/devices/' + id,
    {
      headers: {
        'Authorization': "Bearer " + holder.access_token,
        'Content-Type': 'application/json'
      },
      agent: httpsAgent,
      method: "PATCH",
      body: JSON.stringify([{ attributes: { blindsTargetLevel: value } }])
    }
  )
  if (!String(response.status).match(/2\d\d/)) {
    let responseValue = ""
    try {
      responseValue = response.json().error
    } catch {
      responseValue = response.text()
    }
    throw new DirigeraError(`Error updating hub data. Status code: ${response.status}. Response: ${responseValue}`, response)
  }
}

async function start() {
  await dotEnvMini()
  if (process.env.hubIP) holder.hub = process.env.hubIP
  if (process.env.access_token) holder.access_token = process.env.access_token
  
  if (holder.access_token) {
    try {
      await getDevices()
    } catch (error) {
      if (error.responseStatus == 403) {
        await getAccessToken()
        await getDevices()
      }
    }
  } else {
    await getAccessToken()
    await getDevices()
  }
  console.dir(holder)


  // setDevice(process.env.test_blind_id,5)
  await fs.writeFile('logs/holder.json', JSON.stringify(holder, null, 2))
}

start()
