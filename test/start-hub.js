'use strict'
import fakeHub from './fakeDirigeraHub.mjs'

async function startHub (params) {
  await fakeHub(5)
}
startHub()
