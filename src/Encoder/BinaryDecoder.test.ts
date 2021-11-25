import { deepStrictEqual, ok } from 'assert'

import { BinaryDecoder } from './BinaryDecoder'
import { BinaryEncoder, BinaryEncoderOptions } from './BinaryEncoder'
import { BinarySerializable, CustomConstructor, CustomTypeOf } from './BinaryShared'

describe(__filename, () => {
  describe(BinaryDecoder.name, () => {
    const assert = createDecodeAssertion()

    describe('primitives', () => {
      it('decodes boolean', () => {
        assert(true)
        assert(false)
      })
      it('decodes numbers', () => {
        assert(1)
        assert(300)
        assert(90000000)
        assert(55555.222222)
        assert(NaN)
        assert(Infinity)
        assert(-Infinity)
      })
      it('decodes undefined', () => {
        assert(undefined)
      })
      it('decodes null', () => {
        assert(null)
      })
      it('decodes strings', () => {
        assert('foobar')
        assert('wïth ūł8')
      })

      it('decodes bigint', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()
        const input = BigInt('10000')
        const output = decoder.decode(encoder.encode(input))
        const actual = output?.toString()

        ok(typeof actual === 'string')

        deepStrictEqual(actual, input.toString())
      })

      it('decodes RegExp', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()
        const input = /foo/g
        const output = decoder.decode(encoder.encode(input))
        const actual = output?.toString()

        ok(typeof actual === 'string')

        deepStrictEqual(actual, input.toString())
      })

      it('decodes Date', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()
        const input = new Date()
        const output = decoder.decode(encoder.encode(input))
        const actual = output?.toString()

        ok(typeof actual === 'string')

        deepStrictEqual(actual, input.toString())
      })

      it('decodes Symbols', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()

        for (const input of [Symbol(), Symbol('foo'), Symbol.for('bar')]) {
          const output = decoder.decode(encoder.encode(input))
          const actual = output?.toString()

          ok(typeof actual === 'string')
          deepStrictEqual(actual, input.toString())
        }
      })
    })

    describe('Compound Types', () => {
      it('decodes arrays', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()
        const input = [
          1,
          'foo',
          null,
          undefined,
          false,
          true,
          Symbol(),
          Symbol('foo'),
          Symbol.for('foo'),
        ]
        const output = decoder.decode(encoder.encode(input)) as Array<any>
        const actual = output.map((i) => i?.toString() ?? typeof i)

        deepStrictEqual(
          actual,
          input.map((i) => i?.toString() ?? typeof i),
        )
      })

      it('decodes sets', () => {
        const encoder = new BinaryEncoder()
        const decoder = new BinaryDecoder()
        const input = new Set([
          1,
          'foo',
          null,
          undefined,
          false,
          true,
          Symbol(),
          Symbol('foo'),
          Symbol.for('foo'),
        ])
        const output = decoder.decode(encoder.encode(input))

        ok(output instanceof Set)

        const actual = Array.from(output).map((i) => i?.toString() ?? typeof i)

        deepStrictEqual(
          actual,
          Array.from(input).map((i) => i?.toString() ?? typeof i),
        )
      })

      it('decodes Record', () => {
        const input = {
          a: 1,
          [Symbol.for('foo')]: 2,
          3: 4,
        }

        assert(input)
      })

      it('decodes Map', () => {
        const input = new Map<PropertyKey, number>([
          ['a', 1],
          [Symbol.for('foo'), 2],
          [3, 4],
        ])

        assert(input)
      })
    })
  })
})

function createDecodeAssertion<Constructors extends ReadonlyArray<CustomConstructor<any, any>>>(
  encodeOptions: BinaryEncoderOptions<Constructors> = {},
) {
  const encoder = new BinaryEncoder(encodeOptions)
  const decoder = new BinaryDecoder(encodeOptions.constructors)

  return <A extends BinarySerializable | CustomTypeOf<Constructors[number]>>(input: A) =>
    deepStrictEqual(
      input,
      decoder.decode(encoder.encode(input)),
      `Failed on input: ${JSON.stringify(input)}`,
    )
}
