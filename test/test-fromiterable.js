/* eslint-env mocha */

import { CarReader, CarIndexer } from 'datastore-car'
import {
  Block,
  carBytes,
  goCarBytes,
  goCarIndex,
  assert
} from './common.js'
import {
  verifyRoots,
  verifyHas,
  verifyGet,
  verifyBlocks,
  verifyCids
} from './verify-store-reader.js'

function makeIterable (data, chunkSize) {
  let pos = 0
  return {
    [Symbol.asyncIterator] () {
      return {
        async next () {
          await new Promise((resolve) => setTimeout(resolve, 5))
          if (pos >= data.length) {
            return { done: true }
          }
          const value = data.slice(pos, pos += chunkSize)
          return { done: false, value }
        }
      }
    }
  }
}

describe('CarReader.fromIterable()', () => {
  it('complete (single chunk)', async () => {
    const reader = await CarReader(Block).fromIterable(makeIterable(carBytes, carBytes.length))
    await verifyRoots(reader)
    await verifyHas(reader)
    await verifyGet(reader)
    await verifyBlocks(reader)
    await verifyCids(reader)
  })

  it('complete (101-byte chunks)', async () => {
    const reader = await CarReader(Block).fromIterable(makeIterable(carBytes, 101))
    await verifyRoots(reader)
    await verifyHas(reader)
    await verifyGet(reader)
    await verifyBlocks(reader)
    await verifyCids(reader)
  })

  it('complete (64-byte chunks)', async () => {
    const reader = await CarReader(Block).fromIterable(makeIterable(carBytes, 64))
    await verifyRoots(reader)
    await verifyHas(reader)
    await verifyGet(reader)
    await verifyBlocks(reader)
    await verifyCids(reader)
  })

  it('complete (32-byte chunks)', async () => {
    const reader = await CarReader(Block).fromIterable(makeIterable(carBytes, 32))
    await verifyRoots(reader)
    await verifyHas(reader)
    await verifyGet(reader)
    await verifyBlocks(reader)
    await verifyCids(reader)
  })

  it('bad argument', async () => {
    for (const arg of [new Uint8Array(0), true, false, null, undefined, 'string', 100, { obj: 'nope' }]) {
      await assert.isRejected(CarReader(Block).fromIterable(arg))
    }
  })

  it('decode error - truncated', async () => {
    await assert.isRejected(CarReader(Block).fromIterable(makeIterable(carBytes.slice(0, carBytes.length - 10), 64)), {
      name: 'Error',
      message: 'Unexpected end of data'
    })
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
