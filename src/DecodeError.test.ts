import { deepStrictEqual } from 'assert'
import { pipe } from 'fp-ts/function'

import { DecodeErrors, drawError, drawErrors, index, key, leaf, wrap } from './DecodeError'

describe(__filename, () => {
  describe(drawError.name, () => {
    describe('given a Leaf error', () => {
      it('formats the error as expected', () => {
        const actual = 1
        const error = leaf(actual, 'string')
        const expected = `Expected string but received 1`

        deepStrictEqual(pipe(error, drawError), expected)
      })
    })

    describe('given a Key error', () => {
      it('formats the error as expected', () => {
        const k = 'key'
        const actual = 1
        const error = key(k, [leaf(actual, 'string')])
        const expected = `Key ${k}\n└─ Expected string but received 1`

        deepStrictEqual(pipe(error, drawError), expected)
      })
    })

    describe('given an Index error', () => {
      it('formats the error as expected', () => {
        const i = 1
        const actual = 1
        const error = index(i, [leaf(actual, 'string')])
        const expected = `Index ${i}\n└─ Expected string but received 1`

        deepStrictEqual(pipe(error, drawError), expected)
      })
    })

    describe('given a Wrap error', () => {
      it('formats the error as expected', () => {
        const wrapped = 'Extra Info'
        const actual = 1
        const error = wrap(wrapped, [leaf(actual, 'string')])
        const expected = `${wrapped}\n└─ Expected string but received 1`

        deepStrictEqual(pipe(error, drawError), expected)
      })
    })
  })

  describe(drawErrors.name, () => {
    describe('given many errors', () => {
      it('formats the error as expected', () => {
        const errors: DecodeErrors = [
          key('a', [leaf(1, 'string')]),
          key('b', [key('c', [leaf(2, 'string')]), key('d', [leaf(3, 'string')])]),
          key('e', [wrap('Extra', [key('f', [leaf(4, 'string')])])]),
        ]
        const expected = `Key a
└─ Expected string but received 1
Key b
├─ Key c
│  └─ Expected string but received 2
└─ Key d
   └─ Expected string but received 3
Key e
└─ Extra
   └─ Key f
      └─ Expected string but received 4`

        deepStrictEqual(pipe(errors, drawErrors), expected)
      })
    })
  })
})
