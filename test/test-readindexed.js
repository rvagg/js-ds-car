/* eslint-env mocha */

const assert = require('assert')
const path = require('path')
const multiformats = require('multiformats/basics.js')
multiformats.add(require('@ipld/dag-cbor'))
multiformats.multibase.add(require('multiformats/bases/base58.js'))
const { readFileIndexed } = require('../')(multiformats)
const { acid, makeData, compareBlockData, verifyBlocks, verifyHas, verifyRoots } = require('./fixture-data')

let rawBlocks, allBlocks

describe('Read Indexed', () => {
  before(async () => {
    const data = await makeData()
    rawBlocks = data.rawBlocks
    allBlocks = data.allBlocksFlattened
  })

  it('read existing', async () => {
    const carDs = await readFileIndexed(path.join(__dirname, 'go.car'))
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await assert.rejects(carDs.get(rawBlocks[3].cid)) // doesn't exist
    await carDs.close()
  })

  it('verify only roots', async () => {
    // tests deferred open for getRoots()
    const carDs = await readFileIndexed(path.join(__dirname, 'go.car'))
    await verifyRoots(carDs)
    await carDs.close()
  })

  // when we instantiate from a Stream, CarDatastore should be immutable
  it('immutable', async () => {
    const carDs = await readFileIndexed(path.join(__dirname, 'go.car'))
    await assert.rejects(carDs.put(acid, Buffer.from('blip')))
    await assert.rejects(carDs.delete(acid, Buffer.from('blip')))
    await assert.rejects(carDs.setRoots(acid))
    await assert.rejects(carDs.setRoots([acid]))
  })

  it('read existing (query())', async () => {
    const carDs = await readFileIndexed(path.join(__dirname, 'go.car'))

    async function verify () {
      const blocks_ = allBlocks.slice()
      const cids = []
      for (const block of blocks_) {
        cids.push(block.cid.toString())
      }

      let i = 0
      for await (const entry of carDs.query()) {
        assert.deepStrictEqual(Object.keys(entry), ['key', 'value'])
        const foundIndex = cids.findIndex((cid) => cid === entry.key)
        if (foundIndex < 0) {
          assert.fail(`Unexpected CID/key found: ${entry.key}`)
        }
        compareBlockData(entry.value, blocks_[foundIndex].binary, `#${i++}`)
        cids.splice(foundIndex, 1)
        blocks_.splice(foundIndex, 1)
      }
      assert.strictEqual(cids.length, 0, 'found all expected CIDs')
      // test after
      await verifyRoots(carDs)
    }

    await verify()
    await verify() // second pass, file should be open now

    await carDs.close()
  })

  it('read existing (query({keysOnly}))', async () => {
    const blocks_ = allBlocks.slice()
    const cids = []
    for (const block of blocks_) {
      cids.push(await block.cid.toString())
    }

    const carDs = await readFileIndexed(path.join(__dirname, 'go.car'))

    // test before
    await verifyRoots(carDs)

    for await (const entry of carDs.query({ keysOnly: true })) {
      assert.deepStrictEqual(Object.keys(entry), ['key'])
      const foundIndex = cids.findIndex((cid) => cid === entry.key)
      if (foundIndex < 0) {
        assert.fail(`Unexpected CID/key found: ${entry.key}`)
      }
      assert.strictEqual(entry.value, undefined, 'no `value`')
      cids.splice(foundIndex, 1)
      blocks_.splice(foundIndex, 1)
    }
    assert.strictEqual(cids.length, 0, 'found all expected CIDs')
    await carDs.close()
  })
})