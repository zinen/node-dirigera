


## Examples

hubAddress = ip/DNS/hostname of hub.
access_token = Will be made when you push the button on the backside of the hub.
debug = 0 - 5. Optional, default = 0. 0 means no debugging in console. 5 means a lot of debugging 
clientName = Optional, default = your hostname. The name you find in the Dirigera app for this connection. Will appear after accessToken is setup
```js
import DirigeraHub from 'node-dirigera'
// First time:
const options = { hubAddress: '192.1.1.2', debug: 5, clientName: 'test-node-dirigera' }

// Next runtime (with accessToken)
const options = { hubAddress: '192.1.1.2', debug: 5, access_token: accessToken, clientName: 'test-node-dirigera' }

  const dirigeraHub = new DirigeraHub(options)

```
getAccessToken
How to get an access token
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2'})
  accessToken = await dirigeraHub.getAccessToken()
  console.log(accessToken)
  // Save accessToken to disk, .env or other config
}
start()
```


Return device details
getDevice
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2', access_token: 'lallaal'})
  // device = 'bedroom light' // define by given name
  // device = 'b8f3f21e-0fec-4b20-8de4-7fe7f7' // Define by its ID
  // device = null/undefined - returns all devices
  devices = await dirigeraHub.getDevice(device)
  console.log(devices)
  // Save accessToken to disk, .env or other config
}
start()
```

logIn - is also called automatic on relevant calls. This can be used at start of the process to confirm a working access token or to start request a new one.
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2', access_token: 'lallaal'})
  try {
    await dirigeraHub.logIn()
    console.warn('Login success!')
  } catch (error) {
    console.warn('Login failed. Access token might be invalid')
  }
  
}
start()
```

setDevice
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2', access_token: 'lallaal'})
  // device = 'bedroom blinds' // define by given name
  // device = 'b8f3f21e-0fec-4b20-8de4-7fe7f7' // Define by its ID
  // device = null/undefined - returns all devices
  const attribute = 'blindsTargetLevel' // Allowed values can be found via getDevice() under capabilities.canReceive
  const value = 0 // 0 = open, 100 = close
  await dirigeraHub.setDevice(device, attribute, value)


}
start()
```

getRoom
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2', access_token: 'lallaal'})
  // room = 'Bedroom' // define by given name
  // room = 'b8f3f21e-0fec-4b20-8de4-7fe7f7' // Define by its room ID
  const room = 'Bedroom'
  const deviceType = 'blinds' // Optional: Limit to specific device type
  dirigeraHub.getRoom(room, deviceType)
}
start()
```

setRoom
```js
async function start() {
  const dirigeraHub = new DirigeraHub({ hubAddress: '192.1.1.2', access_token: 'lallaal'})
  // room = 'Bedroom' // define by given name
  // room = 'b8f3f21e-0fec-4b20-8de4-7fe7f7' // Define by its room ID
  const room = 'Bedroom'
  const value = 0 // 0 = open, 100 = close
  const deviceType = 'blinds' // Optional: Limit to specific device type
  await dirigeraHub.setRoom(room, attribute, value,deviceType)
}
start()
```

### ETC

Reversed engineered som API points: https://codeberg.org/argrento/dirigera