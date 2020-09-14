/* eslint-env mocha */

import { CarIndexer } from 'datastore-car'
import { Block, goCarBytes, goCarIndex, makeIterable, assert } from './common.js'
import { verifyRoots } from './verify-store-reader.js'

describe('CarIndexer.fromBytes()', () => {
  it('complete', async () => {
    const indexer = await CarIndexer(Block).fromBytes(goCarBytes)

    await verifyRoots(indexer) // behaves like an Reader for roots

    const indexData = []
    for await (const index of indexer) {
      indexData.push(index)
    }

    assert.deepStrictEqual(indexData, goCarIndex)
  })

  it('bad argument', async () => {
    for (const arg of [true, false, null, undefined, 'string', 100, { obj: 'nope' }]) {
      await assert.isRejected(CarIndexer(Block).fromBytes(arg))
    }
  })
})

describe('CarIndexer.fromIterable()', () => {
  async function verifyIndexer (indexer) {
    await verifyRoots(indexer) // behaves like an Reader for roots

    const indexData = []
    for await (const index of indexer) {
      indexData.push(index)
    }

    assert.deepStrictEqual(indexData, goCarIndex)
  }

  it('complete (single chunk)', async () => {
    const indexer = await CarIndexer(Block).fromIterable(makeIterable(goCarBytes, goCarBytes.length))
    return verifyIndexer(indexer)
  })

  it('complete (101-byte chunks)', async () => {
    const indexer = await CarIndexer(Block).fromIterable(makeIterable(goCarBytes, 101))
    return verifyIndexer(indexer)
  })

  it('complete (32-byte chunks)', async () => {
    const indexer = await CarIndexer(Block).fromIterable(makeIterable(goCarBytes, 32))
    return verifyIndexer(indexer)
  })

  it('bad argument', async () => {
    for (const arg of [new Uint8Array(0), true, false, null, undefined, 'string', 100, { obj: 'nope' }]) {
      await assert.isRejected(CarIndexer(Block).fromIterable(arg))
    }
  })
})