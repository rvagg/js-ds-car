/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const multiformats = require('multiformats/basics.js')
multiformats.add(require('@ipld/dag-cbor'))
multiformats.multibase.add(require('multiformats/bases/base58.js'))
const { readStreamComplete } = require('../')(multiformats)
const { acid, makeData, verifyBlocks, verifyHas, verifyRoots } = require('./fixture-data')

let rawBlocks

describe('Read Stream', () => {
  before(async () => {
    const data = await makeData()
    rawBlocks = data.rawBlocks
  })

  it('read existing', async () => {
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await assert.rejects(carDs.get(rawBlocks[3].cid)) // doesn't exist
    await carDs.close()
  })

  it('verify only roots', async () => {
    // tests deferred open for getRoots()
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await verifyRoots(carDs)
    await carDs.close()
  })

  // when we instantiate from a Stream, CarDatastore should be immutable
  it('immutable', async () => {
    const carDs = await readStreamComplete(fs.createReadStream(path.join(__dirname, 'go.car')))
    await assert.rejects(carDs.put(acid, Buffer.from('blip')))
    await assert.rejects(carDs.delete(acid, Buffer.from('blip')))
    await assert.rejects(carDs.setRoots(acid))
    await assert.rejects(carDs.setRoots([acid]))
  })
})
