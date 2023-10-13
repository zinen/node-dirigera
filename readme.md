# Node-dirigera

*NOT ON npmjs.com yet* 

Early work in progress

Node.js module to interact with Dirigera hub from Ikea smart home system as of year 2023.
This module aims for low amount of dependencies and promise based. And not requiring Interactive access to console.
Install size is right now less then 0,5 MB

## Examples

hubAddress = ip/DNS/hostname of hub.
access_token = Will be made when you push the button on the backside of the hub.
debug = 0 - 5. Optional, default = 0. 0 means no debugging in console. 5 means a lot of debugging 
clientName = Optional, default = your hostname. The name you find in the Dirigera app for this connection. Will appear after accessToken is setup
```js
import DirigeraHub from 'node-dirigera'
// OR
const DirigeraHub = require('node-dirigera')

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
  // The next command can take up to 1 minute as it will be waiting for you to push the button.
  // it will continuously check the hub for a push. Once the button is pressed you will get the access token.
  // If you don't make it to the hub an error is thrown(promise reject).
  try {
    accessToken = await dirigeraHub.getAccessToken()
    console.log('All good. Here is your access token:')
    console.log(accessToken)
  } catch (error) {
    console.log(error)
  }
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
  // The same values are also stored in dirigeraHub.data.devices
  console.log(dirigeraHub.data.devices)
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
  const result = await dirigeraHub.setRoom(room, attribute, value,deviceType)
  // result = { ok: [list of devices handled ok], errors: [list of errors if any] }
}
start()
```

### ETC

Inspiration has been found here:

Reversed engineering of some API points: https://codeberg.org/argrento/dirigera

Python prof-of-concept: https://github.com/mattias73andersson/dirigera-client-poc

Node-red manual flow: https://gist.github.com/ukmoose/f4cce80dea79791c0a130a8ca2379d38

### Other alternatives:

Node.js implementation based on callbacks https://bitbucket.org/fair2/dirigera-simple/src/master/
 - This one was as of 2023-10-13 not handling errors very pretty or at all some times. 
 - Install size due to dependencies is 7,5 MB. Thats very big.

Node.js implementation with typescript using promises https://github.com/lpgera/dirigera
- This one requires as of 2023-10-13 requires Interactive access to console. Deal breaker for server setups.
- Install size is less then 2 MB. Thats acceptable.