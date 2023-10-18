'use strict'
import DirigeraHub from '../index.mjs'
import assert from 'node:assert'
import fakeHub from './fakeDirigeraHub.mjs'

let fakeHubReady = false

async function promiseTimeout (delay) {
  console.log('promiseTimeout called waiting for', delay, 'ms')
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function startHub (params) {
  try {
    await fakeHub(1)
  } catch (error) {
    if (String(error) === 'Error: listen EADDRINUSE: address already in use :::8443') {
      console.log('Fake hub is running elsewhere. Reusing that connection')
    } else {
      console.error(String(error))
      process.exit(1)
    }
  }
  fakeHubReady = true
}
startHub()

async function startTest () {
  let counter = 0
  while (fakeHubReady === false) {
    await promiseTimeout(300)
    counter++
    if (counter > 200) {
      fakeHubReady = false
      throw new Error('Error: Fake hub never became available')
    }
  }
  const accessToken = null // 'fakebGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRlN2RmNmFiYTYwMTM2ZDcyNmRjMWIyfakeMzUwODA1ZGRlOTc3OTY1OTU4Njg0OGMzNmRlMzY2YjhhM2YwNDcifQ.eyJpc3MiOiI5Yjc2YTI4Zi1mMjk5LTQ2OWEtODg0NC1iZWYyM2NmM2Q3NWUiLCJ0eXBlIjoifakeZXNzIiwiYXVkIjoiaG9tZXNtYXJ0LmxvY2FsIiwic3ViIjoiNTU5NWI3ZDAtN2Q3Ni00YjI1LThjODItODNjZmI2MmY0Mjc1IiwiaWF0IjoxNjk3MzkzMDk5LCJleHAiOjIwMTI5NjkwOTl9.c8W087nMe_WNxKzHN_HQ8iE12u9AW8bd6J3fPp3spnS54nUKN_fake6gBwAR5KqWZzNfOlXeb7Tuvahk1JqCww'
  const dirigeraHub = new DirigeraHub({ hubAddress: 'localhost', access_token: accessToken, debug: 0, clientName: 'test-node-dirigera' })
  try {
    await dirigeraHub.logIn()
  } catch {
    await dirigeraHub.getAccessToken()
  }
  const deviceDataExpected = [
    {
      id: '9b76a28f-fake-469a-fake-bef23cf3d75e_1',
      relationId: '9b76a28f-fake-469a-fake-bef23cf3d75e',
      type: 'gateway',
      deviceType: 'gateway',
      createdAt: '2023-08-01T14:40:13.725Z',
      isReachable: true,
      lastSeen: '2023-10-14T19:23:00.229Z',
      attributes: {
        customName: 'My home',
        model: 'DIRIGERA Hub for smart products',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '2.391.4',
        hardwareVersion: 'P2.5',
        serialNumber: '9b76a28f-fake-469a-fake-bef23cf3d75e',
        identifyStarted: '2000-01-01T00:00:00.000Z',
        identifyPeriod: 0,
        otaStatus: 'upToDate',
        otaState: 'readyToCheck',
        otaProgress: 0,
        otaPolicy: 'autoDownload',
        otaScheduleStart: '00:00',
        otaScheduleEnd: '00:00',
        permittingJoin: false,
        backendConnected: true,
        backendConnectionPersistent: true,
        backendOnboardingComplete: true,
        backendRegion: 'eu-central-x',
        backendCountryCode: 'DE',
        userConsents: [
          {
            name: 'analytics',
            value: 'disabled'
          },
          {
            name: 'diagnostics',
            value: 'enabled'
          }
        ],
        logLevel: 3,
        coredump: false,
        timezone: 'Europe/Germany',
        nextSunSet: '2023-10-15T16:13:00.000Z',
        nextSunRise: '2023-10-15T05:40:00.000Z',
        homestateValue: 'home',
        homestateLastChanged: '2023-08-01T16:40:13+02:00',
        countryCode: 'XZ',
        coordinates: {
          latitude: 53.5485718018912,
          longitude: 9.799669263464574,
          accuracy: -1
        },
        isOn: false
      },
      capabilities: {
        canSend: [],
        canReceive: [
          'customName',
          'permittingJoin',
          'userConsents',
          'logLevel',
          'time',
          'timezone',
          'countryCode',
          'coordinates'
        ]
      },
      deviceSet: [],
      remoteLinks: []
    },
    {
      id: '1e3d3d06-fake-425d-fake-403465e0733d_1',
      type: 'blinds',
      deviceType: 'blinds',
      createdAt: '2023-10-08T13:34:47.000Z',
      isReachable: true,
      lastSeen: '2023-10-14T17:15:16.000Z',
      attributes: {
        customName: 'Blinds south wall',
        model: 'PRAKTLYSING cellular blind',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '24.4.13',
        hardwareVersion: '1',
        serialNumber: 'B4E3F9FAKED5C5C9',
        productCode: 'E2021',
        batteryPercentage: 11,
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
        canSend: [],
        canReceive: [
          'customName',
          'blindsCurrentLevel',
          'blindsTargetLevel',
          'blindsState'
        ]
      },
      room: {
        id: '98694611-fake-44c5-fake-685d8347eb1d',
        name: 'Office',
        color: 'ikea_green_no_65',
        icon: 'rooms_cutlery'
      },
      deviceSet: [],
      remoteLinks: [
        'a578dfac-fake-43e6-fake-107cb6b9dcdf_1'
      ],
      isHidden: false
    },
    {
      id: 'a578dfac-fake-43e6-fake-107cb6b9dcdf_1',
      type: 'controller',
      deviceType: 'blindsController',
      createdAt: '2023-09-29T18:21:16.000Z',
      isReachable: true,
      lastSeen: '2023-10-14T19:22:47.000Z',
      attributes: {
        customName: 'Remote office',
        model: 'TRADFRI open/close remote',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '24.4.6',
        hardwareVersion: '1',
        serialNumber: 'F4B3B1FAKE8B2F97',
        productCode: 'E1766',
        batteryPercentage: 75,
        isOn: false,
        lightLevel: 1,
        blindsCurrentLevel: 0,
        blindsState: '',
        permittingJoin: false,
        otaStatus: 'upToDate',
        otaState: 'readyToCheck',
        otaProgress: 0,
        otaPolicy: 'autoUpdate',
        otaScheduleStart: '00:00',
        otaScheduleEnd: '00:00'
      },
      capabilities: {
        canSend: [
          'isOn',
          'lightLevel',
          'blindsState'
        ],
        canReceive: [
          'customName'
        ]
      },
      room: {
        id: '98694611-fake-44c5-fake-685d8347eb1d',
        name: 'Office',
        color: 'ikea_green_no_65',
        icon: 'rooms_cutlery'
      },
      deviceSet: [],
      remoteLinks: [],
      isHidden: false
    },
    {
      id: '52900ad7-fake-4262-fake-8986a069ada9_1',
      type: 'light',
      deviceType: 'light',
      createdAt: '2023-10-14T12:27:22.000Z',
      isReachable: true,
      lastSeen: '2023-10-14T19:27:50.000Z',
      attributes: {
        customName: 'Lamp one',
        firmwareVersion: '1.1.003',
        hardwareVersion: '1',
        manufacturer: 'IKEA of Sweden',
        model: 'TRADFRI bulb E14 WS globe 470lm',
        productCode: 'LED2101G4',
        serialNumber: '287681FAKE6FA48A',
        isOn: true,
        startupOnOff: 'startOn',
        lightLevel: 40,
        colorMode: 'temperature',
        startupTemperature: -1,
        colorTemperature: 3003,
        colorTemperatureMax: 2202,
        colorTemperatureMin: 4000,
        identifyPeriod: 0,
        identifyStarted: '2000-01-01T00:00:00.000Z',
        permittingJoin: false,
        otaPolicy: 'autoUpdate',
        otaProgress: 0,
        otaScheduleEnd: '00:00',
        otaScheduleStart: '00:00',
        otaState: 'readyToCheck',
        otaStatus: 'upToDate',
        circadianRhythmMode: ''
      },
      capabilities: {
        canSend: [],
        canReceive: [
          'customName',
          'isOn',
          'lightLevel',
          'colorTemperature'
        ]
      },
      room: {
        id: '190aae9d-fake-4a12-fake-2b5c71282e20',
        name: 'Living room',
        color: 'ikea_red_no_39',
        icon: 'rooms_arm_chair'
      },
      deviceSet: [],
      remoteLinks: [],
      isHidden: false
    }
  ]
  assert.deepStrictEqual(await dirigeraHub.getDevice(), deviceDataExpected)

  const deviceDataExpected2 = {
    id: '52900ad7-fake-4262-fake-8986a069ada9_1',
    type: 'light',
    deviceType: 'light',
    createdAt: '2023-10-14T12:27:22.000Z',
    isReachable: true,
    lastSeen: '2023-10-14T19:27:50.000Z',
    attributes: {
      customName: 'Lamp one',
      firmwareVersion: '1.1.003',
      hardwareVersion: '1',
      manufacturer: 'IKEA of Sweden',
      model: 'TRADFRI bulb E14 WS globe 470lm',
      productCode: 'LED2101G4',
      serialNumber: '287681FAKE6FA48A',
      isOn: true,
      startupOnOff: 'startOn',
      lightLevel: 40,
      colorMode: 'temperature',
      startupTemperature: -1,
      colorTemperature: 3003,
      colorTemperatureMax: 2202,
      colorTemperatureMin: 4000,
      identifyPeriod: 0,
      identifyStarted: '2000-01-01T00:00:00.000Z',
      permittingJoin: false,
      otaPolicy: 'autoUpdate',
      otaProgress: 0,
      otaScheduleEnd: '00:00',
      otaScheduleStart: '00:00',
      otaState: 'readyToCheck',
      otaStatus: 'upToDate',
      circadianRhythmMode: ''
    },
    capabilities: {
      canSend: [],
      canReceive: [
        'customName',
        'isOn',
        'lightLevel',
        'colorTemperature'
      ]
    },
    room: {
      id: '190aae9d-fake-4a12-fake-2b5c71282e20',
      name: 'Living room',
      color: 'ikea_red_no_39',
      icon: 'rooms_arm_chair'
    },
    deviceSet: [],
    remoteLinks: [],
    isHidden: false
  }
  assert.deepStrictEqual(await dirigeraHub.getDevice('52900ad7-fake-4262-fake-8986a069ada9_1'), deviceDataExpected2)

  assert.deepStrictEqual(await dirigeraHub.getDevice('Lamp one'), deviceDataExpected2)

  const getRoomExpected = [
    {
      id: '1e3d3d06-fake-425d-fake-403465e0733d_1',
      type: 'blinds',
      deviceType: 'blinds',
      createdAt: '2023-10-08T13:34:47.000Z',
      isReachable: true,
      lastSeen: '2023-10-14T17:15:16.000Z',
      attributes: {
        customName: 'Blinds south wall',
        model: 'PRAKTLYSING cellular blind',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '24.4.13',
        hardwareVersion: '1',
        serialNumber: 'B4E3F9FAKED5C5C9',
        productCode: 'E2021',
        batteryPercentage: 11,
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
        canSend: [],
        canReceive: [
          'customName',
          'blindsCurrentLevel',
          'blindsTargetLevel',
          'blindsState'
        ]
      },
      room: {
        id: '98694611-fake-44c5-fake-685d8347eb1d',
        name: 'Office',
        color: 'ikea_green_no_65',
        icon: 'rooms_cutlery'
      },
      deviceSet: [],
      remoteLinks: ['a578dfac-fake-43e6-fake-107cb6b9dcdf_1'],
      isHidden: false
    },
    {
      id: 'a578dfac-fake-43e6-fake-107cb6b9dcdf_1',
      type: 'controller',
      deviceType: 'blindsController',
      createdAt: '2023-09-29T18:21:16.000Z',
      isReachable: true,
      lastSeen: '2023-10-14T19:22:47.000Z',
      attributes: {
        customName: 'Remote office',
        model: 'TRADFRI open/close remote',
        manufacturer: 'IKEA of Sweden',
        firmwareVersion: '24.4.6',
        hardwareVersion: '1',
        serialNumber: 'F4B3B1FAKE8B2F97',
        productCode: 'E1766',
        batteryPercentage: 75,
        isOn: false,
        lightLevel: 1,
        blindsCurrentLevel: 0,
        blindsState: '',
        permittingJoin: false,
        otaStatus: 'upToDate',
        otaState: 'readyToCheck',
        otaProgress: 0,
        otaPolicy: 'autoUpdate',
        otaScheduleStart: '00:00',
        otaScheduleEnd: '00:00'
      },
      capabilities: {
        canSend: ['isOn', 'lightLevel', 'blindsState'],
        canReceive: ['customName']
      },
      room: {
        id: '98694611-fake-44c5-fake-685d8347eb1d',
        name: 'Office',
        color: 'ikea_green_no_65',
        icon: 'rooms_cutlery'
      },
      deviceSet: [],
      remoteLinks: [],
      isHidden: false
    }
  ]
  assert.deepStrictEqual(await dirigeraHub.getRoom('Office'), getRoomExpected)

  assert.rejects(
    dirigeraHub.getDevice('asdasdas'),
    { message: 'Device Id asdasdas not found' }
  )

  const getSceneExpected = [
    {
      id: '8a38a1f1-3166-fake-8e33-fakef5c0b78b',
      info: {
        name: 'Scene office',
        icon: 'scenes_sun_horizon'
      },
      type: 'userScene',
      triggers: [
        {
          id: '3defe3fd-946c-fake-a66a-fake69f9a11a',
          type: 'time',
          triggeredAt: '2023-10-14T16:15:00.466Z',
          disabled: false,
          trigger: {
            days: [
              'Mon',
              'Tue',
              'Wed',
              'Thu',
              'Fri',
              'Sat',
              'Sun'
            ],
            time: '18:15'
          },
          nextTriggerAt: '2023-10-15T16:15:00.000Z',
          endTriggerEvent: {
            type: 'sunriseSunset',
            trigger: {
              type: 'sunrise',
              offset: 0
            },
            nextTriggerAt: null
          }
        },
        {
          id: '3cf9a576-c433-fake-9033-fake46db65ee',
          type: 'app',
          disabled: false,
          endTriggerEvent: {
            type: 'sunriseSunset',
            trigger: {
              type: 'sunrise',
              offset: 0
            },
            nextTriggerAt: null
          }
        }
      ],
      actions: [
        {
          id: '103d345f-0281-fake-b8ff-faked4a398ec_1',
          type: 'device',
          deviceId: '103d345f-0281-fake-b8ff-faked4a398ec_1',
          attributes: {
            blindsTargetLevel: 100
          }
        }
      ],
      commands: [],
      createdAt: '2023-09-30T09:31:39.859Z',
      lastCompleted: '2023-10-14T16:15:00.524Z',
      lastTriggered: '2023-10-14T16:15:00.524Z',
      undoAllowedDuration: 30
    }
  ]
  assert.deepStrictEqual(await dirigeraHub.getScene(), getSceneExpected)

  const getSceneIDExpected = {
    id: '8a38a1f1-3166-fake-8e33-fakef5c0b78b',
    info: {
      name: 'Scene office',
      icon: 'scenes_sun_horizon'
    },
    type: 'userScene',
    triggers: [
      {
        id: '3defe3fd-946c-fake-a66a-fake69f9a11a',
        type: 'time',
        triggeredAt: '2023-10-14T16:15:00.466Z',
        disabled: false,
        trigger: {
          days: [
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun'
          ],
          time: '18:15'
        },
        nextTriggerAt: '2023-10-15T16:15:00.000Z',
        endTriggerEvent: {
          type: 'sunriseSunset',
          trigger: {
            type: 'sunrise',
            offset: 0
          },
          nextTriggerAt: null
        }
      },
      {
        id: '3cf9a576-c433-fake-9033-fake46db65ee',
        type: 'app',
        disabled: false,
        endTriggerEvent: {
          type: 'sunriseSunset',
          trigger: {
            type: 'sunrise',
            offset: 0
          },
          nextTriggerAt: null
        }
      }
    ],
    actions: [
      {
        id: '103d345f-0281-fake-b8ff-faked4a398ec_1',
        type: 'device',
        deviceId: '103d345f-0281-fake-b8ff-faked4a398ec_1',
        attributes: {
          blindsTargetLevel: 100
        }
      }
    ],
    commands: [],
    createdAt: '2023-09-30T09:31:39.859Z',
    lastCompleted: '2023-10-14T16:15:00.524Z',
    lastTriggered: '2023-10-14T16:15:00.524Z',
    undoAllowedDuration: 30
  }
  assert.deepStrictEqual(await dirigeraHub.getScene('8a38a1f1-3166-fake-8e33-fakef5c0b78b'), getSceneIDExpected)

  const getSceneNameExpected = {
    id: '8a38a1f1-3166-fake-8e33-fakef5c0b78b',
    info: {
      name: 'Scene office',
      icon: 'scenes_sun_horizon'
    },
    type: 'userScene',
    triggers: [
      {
        id: '3defe3fd-946c-fake-a66a-fake69f9a11a',
        type: 'time',
        triggeredAt: '2023-10-14T16:15:00.466Z',
        disabled: false,
        trigger: {
          days: [
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun'
          ],
          time: '18:15'
        },
        nextTriggerAt: '2023-10-15T16:15:00.000Z',
        endTriggerEvent: {
          type: 'sunriseSunset',
          trigger: {
            type: 'sunrise',
            offset: 0
          },
          nextTriggerAt: null
        }
      },
      {
        id: '3cf9a576-c433-fake-9033-fake46db65ee',
        type: 'app',
        disabled: false,
        endTriggerEvent: {
          type: 'sunriseSunset',
          trigger: {
            type: 'sunrise',
            offset: 0
          },
          nextTriggerAt: null
        }
      }
    ],
    actions: [
      {
        id: '103d345f-0281-fake-b8ff-faked4a398ec_1',
        type: 'device',
        deviceId: '103d345f-0281-fake-b8ff-faked4a398ec_1',
        attributes: {
          blindsTargetLevel: 100
        }
      }
    ],
    commands: [],
    createdAt: '2023-09-30T09:31:39.859Z',
    lastCompleted: '2023-10-14T16:15:00.524Z',
    lastTriggered: '2023-10-14T16:15:00.524Z',
    undoAllowedDuration: 30
  }
  assert.deepStrictEqual(await dirigeraHub.getScene('Scene office'), getSceneNameExpected)

  assert.deepStrictEqual(await dirigeraHub.triggerScene('Scene office'), '')

  assert.rejects(
    dirigeraHub.triggerScene('unknown scene office'),
    { message: 'Scene Id unknown scene office not found' }
  )

  console.log('Module tests done. All good. Reach end of test')
  process.exit()
}

startTest()
