import { deepStrictEqual } from 'assert'

import { BinaryEncoder } from './BinaryEncoder'
import { BinarySerializable, CustomConstructor, CustomTypeOf, SupportedType } from './BinaryShared'

describe(__filename, () => {
  describe('Primitives', () => {
    const encoder = new BinaryEncoder()

    it('encodes boolean', () => {
      testEncoding(encoder, false, [SupportedType.False])
      testEncoding(encoder, true, [SupportedType.True])
    })

    it('encodes undefined', () => {
      testEncoding(encoder, undefined, [SupportedType.Undefined])
    })

    it('encodes null', () => {
      testEncoding(encoder, null, [SupportedType.Null])
    })

    it('encodes strings', () => {
      testEncoding(encoder, 'foo', [
        SupportedType.String,
        SupportedType.UInt8,
        3,
        ...charCodes('foo'),
      ])
    })

    it('encodes numbers', () => {
      testEncoding(encoder, 0, [SupportedType.UInt8, 0])
      testEncoding(encoder, 300, [SupportedType.UInt16, 44, 1])
      testEncoding(encoder, 42.3, [SupportedType.Float, 102, 102, 102, 102, 102, 38, 69, 64])
    })

    it('encodes symbols', () => {
      testEncoding(encoder, Symbol(), [SupportedType.Symbol])
      testEncoding(encoder, Symbol('foo'), [
        SupportedType.SymbolDescription,
        SupportedType.String,
        SupportedType.UInt8,
        3,
        ...charCodes('foo'),
      ])
      testEncoding(encoder, Symbol.for('foo'), [
        SupportedType.SymbolFor,
        SupportedType.String,
        SupportedType.UInt8,
        3,
        ...charCodes('foo'),
      ])
    })

    it('encodes bigint', () => {
      testEncoding(encoder, BigInt(10000), [
        SupportedType.BigInt,
        SupportedType.String,
        SupportedType.UInt8,
        5,
        ...charCodes('10000'),
      ])
    })

    it('encodes RegExp', () => {
      testEncoding(encoder, /foo/g, [
        SupportedType.RegExp,
        SupportedType.String,
        SupportedType.UInt8,
        3,
        ...charCodes('foo'),
        SupportedType.String,
        SupportedType.UInt8,
        1,
        ...charCodes('g'),
      ])
    })

    it('encodes Dates', () => {
      testEncoding(encoder, new Date('2015-03-25'), [
        SupportedType.Date,
        SupportedType.Float,
        0,
        0,
        64,
        168,
        227,
        196,
        116,
        66,
      ])
    })
  })

  describe('Compound Types', () => {
    const encoder = new BinaryEncoder()

    it('encodes Arrays', () => {
      testEncoding(
        encoder,
        [1, 'foo', null, undefined, false, true, Symbol(), Symbol('foo'), Symbol.for('foo')],
        [
          SupportedType.ArrayStart,
          SupportedType.UInt8,
          1,
          SupportedType.String,
          SupportedType.UInt8,
          3,
          ...charCodes('foo'),
          SupportedType.Null,
          SupportedType.Undefined,
          SupportedType.False,
          SupportedType.True,
          SupportedType.Symbol,
          SupportedType.SymbolDescription,
          SupportedType.Ref,
          SupportedType.UInt8,
          3,
          SupportedType.SymbolFor,
          SupportedType.Ref,
          SupportedType.UInt8,
          3,
          SupportedType.ArrayEnd,
        ],
      )
    })

    it('encodes Records', () => {
      const input = {
        a: 1,
        [Symbol.for('foo')]: 2,
        3: 4,
      }

      const keyValue = (k: Array<number>, v: Array<number>) => [...k, ...v]

      testEncoding(encoder, input, [
        SupportedType.RecordStart,
        ...keyValue(
          [SupportedType.String, SupportedType.UInt8, 1, ...charCodes('3')],
          [SupportedType.UInt8, 4],
        ),
        ...keyValue(
          [SupportedType.String, SupportedType.UInt8, 1, ...charCodes('a')],
          [SupportedType.UInt8, 1],
        ),
        ...keyValue(
          [
            SupportedType.SymbolFor,
            SupportedType.String,
            SupportedType.UInt8,
            3,
            ...charCodes('foo'),
          ],
          [SupportedType.UInt8, 2, SupportedType.RecordEnd],
        ),
      ])
    })

    it('encodes Sets', () => {
      testEncoding(
        encoder,
        new Set([
          1,
          'foo',
          null,
          undefined,
          false,
          true,
          Symbol(),
          Symbol('foo'),
          Symbol.for('foo'),
        ]),
        [
          SupportedType.SetStart,
          SupportedType.UInt8,
          1,
          SupportedType.String,
          SupportedType.UInt8,
          3,
          ...charCodes('foo'),
          SupportedType.Null,
          SupportedType.Undefined,
          SupportedType.False,
          SupportedType.True,
          SupportedType.Symbol,
          SupportedType.SymbolDescription,
          SupportedType.Ref,
          SupportedType.UInt8,
          3,
          SupportedType.SymbolFor,
          SupportedType.Ref,
          SupportedType.UInt8,
          3,
          SupportedType.SetEnd,
        ],
      )
    })

    it('encodes Maps', () => {
      const input = new Map<PropertyKey, number>([
        ['a', 1],
        [Symbol.for('foo'), 2],
        [3, 4],
      ])

      testEncoding(encoder, input, [
        SupportedType.MapStart,
        SupportedType.String,
        SupportedType.UInt8,
        1,
        ...charCodes('a'),
        SupportedType.UInt8,
        1,
        SupportedType.SymbolFor,
        SupportedType.String,
        SupportedType.UInt8,
        3,
        ...charCodes('foo'),
        SupportedType.UInt8,
        2,
        SupportedType.UInt8,
        3,
        SupportedType.UInt8,
        4,
        SupportedType.MapEnd,
      ])
    })
  })
})

function testEncoding<C extends readonly CustomConstructor<any, any>[]>(
  encoder: BinaryEncoder<C>,
  input: BinarySerializable | CustomTypeOf<C[number]>,
  expected: ReadonlyArray<number>,
) {
  deepStrictEqual(Array.from(encoder.encode(input)), expected)
}

function charCodes(s: string) {
  return Array.from(new TextEncoder().encode(s))
}
