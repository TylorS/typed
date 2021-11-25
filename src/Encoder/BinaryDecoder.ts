import { constUndefined } from 'fp-ts/function'

import { BinarySerializable, CustomConstructor, CustomTypeOf, SupportedType } from './BinaryShared'
import { BufferReader } from './BufferReader'

const typeDecoders: Record<
  SupportedType,
  (
    reader: BufferReader,
    references: Map<number, BinarySerializable>,
    constructors?: ReadonlyArray<CustomConstructor<any, any>>,
  ) => BinarySerializable
> = {
  [SupportedType.False]: () => false,
  [SupportedType.Float]: (reader) => reader.readDouble(),
  [SupportedType.Int16]: (reader) => reader.readInt16(),
  [SupportedType.Int32]: (reader) => reader.readInt32(),
  [SupportedType.Int8]: (reader) => reader.readInt8(),
  [SupportedType.Null]: () => null,
  [SupportedType.Undefined]: () => undefined,
  [SupportedType.True]: () => true,
  [SupportedType.UInt16]: (reader) => reader.readUInt16(),
  [SupportedType.UInt32]: (reader) => reader.readUInt32(),
  [SupportedType.UInt8]: (reader) => reader.readUInt8(),
  [SupportedType.String]: (reader, references) => {
    const offset = reader.offset

    return createReference(references, offset, reader.readString())
  },
  [SupportedType.Symbol]: (reader, references) => {
    const offset = reader.offset

    return createReference(references, offset, Symbol())
  },
  [SupportedType.SymbolDescription]: (reader, references, constructors) => {
    const offset = reader.offset

    return createReference(references, offset, Symbol(decodeNext(reader, references, constructors)))
  },
  [SupportedType.SymbolFor]: (reader, references, constructors) => {
    const offset = reader.offset

    return createReference(
      references,
      offset,
      Symbol.for(decodeNext(reader, references, constructors)),
    )
  },
  [SupportedType.BigInt]: (reader, references, constructors) =>
    BigInt(decodeNext(reader, references, constructors)),
  [SupportedType.Date]: (reader, references, constructors) =>
    new Date(decodeNext(reader, references, constructors)),
  [SupportedType.RegExp]: (reader, references, constructors) => {
    const source = decodeNext(reader, references, constructors) as string
    const flags = decodeNext(reader, references, constructors) as string

    return new RegExp(source, flags)
  },
  [SupportedType.ArrayStart]: (reader, references, constructors) => {
    const values: any[] = []

    const offset = reader.offset
    let type = reader.readUInt8()
    while (type !== SupportedType.ArrayEnd) {
      values.push(decodeType(type, reader, references, constructors))
      type = reader.readUInt8()
    }

    return createReference(references, offset, values)
  },
  [SupportedType.SetStart]: (reader, references, constructors) => {
    const values: Set<any> = new Set()

    const offset = reader.offset
    let type = reader.readUInt8()
    while (type !== SupportedType.SetEnd) {
      values.add(decodeType(type, reader, references, constructors))
      type = reader.readUInt8()
    }

    return createReference(references, offset, values)
  },
  [SupportedType.RecordStart]: (reader, references, constructors) => {
    const values: Record<PropertyKey, any> = {}

    const offset = reader.offset
    let type = reader.readUInt8()

    while (type !== SupportedType.RecordEnd) {
      const key = decodeType(type, reader, references, constructors) as PropertyKey
      const value = decodeNext(reader, references, constructors)

      values[key] = value

      type = reader.readUInt8()
    }

    return createReference(references, offset, values)
  },
  [SupportedType.MapStart]: (reader, references, constructors) => {
    const values: Map<any, any> = new Map()

    const offset = reader.offset
    let type = reader.readUInt8()

    while (type !== SupportedType.MapEnd) {
      const key = decodeType(type, reader, references, constructors)
      const value = decodeNext(reader, references, constructors)

      values.set(key, value)
      type = reader.readUInt8()
    }

    return createReference(references, offset, values)
  },
  [SupportedType.Ref]: (reader, references, constructors) => {
    const offset = reader.offset
    const refOffset = decodeNext(reader, references, constructors) as number

    if (!references.has(refOffset)) {
      console.log(`Reference encoding invalid at ${offset} for ${refOffset}`, references)
    }

    return references.get(refOffset as number)!
  },
  [SupportedType.CustomStart]: (reader, references, constructors) => {
    const offset = reader.offset
    const id = decodeNext(reader, references, constructors)
    const constructor = constructors?.find((x) => x.id === id)

    if (!constructor) {
      throw new TypeError(`No Custom Constructors have been defined for: ${JSON.stringify(id)}`)
    }

    const item = decodeType(reader.readUInt8(), reader, references)

    return createReference(references, offset, constructor.decode(item))
  },
  [SupportedType.ArrayEnd]: constUndefined,
  [SupportedType.CustomEnd]: constUndefined,
  [SupportedType.MapEnd]: constUndefined,
  [SupportedType.RecordEnd]: constUndefined,
  [SupportedType.SetEnd]: constUndefined,
}

export class BinaryDecoder<Constructors extends ReadonlyArray<CustomConstructor<any, any>> = []> {
  constructor(readonly constructors?: Constructors) {}

  readonly decode = (
    buffer: ArrayBuffer,
  ): BinarySerializable | CustomTypeOf<Constructors[number]> =>
    decodeNext(new BufferReader(buffer), new Map(), this.constructors)
}

const decodeNext = <Constructors extends ReadonlyArray<CustomConstructor<any, any>> = []>(
  reader: BufferReader,
  references: Map<number, BinarySerializable | CustomTypeOf<Constructors[number]>>,
  constructors?: Constructors,
) => decodeType(reader.readUInt8() as SupportedType, reader, references, constructors)

function decodeType<Constructors extends ReadonlyArray<CustomConstructor<any, any>> = []>(
  type: SupportedType,
  reader: BufferReader,
  references: Map<number, BinarySerializable | CustomTypeOf<Constructors[number]>>,
  constructors?: Constructors,
): BinarySerializable | CustomTypeOf<Constructors[number]> {
  return typeDecoders[type](reader, references, constructors)
}

function createReference<Constructors extends ReadonlyArray<CustomConstructor<any, any>>>(
  references: Map<number, BinarySerializable | CustomTypeOf<Constructors[number]>>,
  offset: number,
  x: BinarySerializable | CustomTypeOf<Constructors[number]>,
): BinarySerializable | CustomTypeOf<Constructors[number]> {
  /* Reading the offset is always off-by-one */
  references.set(offset - 1, x)

  return x
}
