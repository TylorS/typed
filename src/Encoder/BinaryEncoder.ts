import { pipe } from 'fp-ts/function'

import { BinarySerializable, CustomConstructor, CustomTypeOf, SupportedType } from './BinaryShared'
import { BufferWriter } from './BufferWriter'
import { Encoder } from './Encoder'

const DEFAULT_GROWTH_INCREMENT = 2048
const MEMORY_UPPER_BOUND = 65536

const textEncoder = new TextEncoder()
const utf8ToBytes = (utf8: string) => textEncoder.encode(utf8)

export interface BinaryEncoderOptions<
  Constructors extends ReadonlyArray<CustomConstructor<any, any>>,
> {
  readonly constructors?: Constructors
  readonly growthIncrement?: number
  readonly shared?: boolean
  readonly maxSize?: number
}

export class BinaryEncoder<Constructors extends ReadonlyArray<CustomConstructor<any, any>> = []>
  implements Encoder<BinarySerializable | CustomTypeOf<Constructors[number]>, Uint8Array>
{
  // Internal state kept during serialization
  #references: Map<any, number> = new Map()
  #writer: BufferWriter = new BufferWriter(...getDefaultOptions(this.options))

  constructor(readonly options: BinaryEncoderOptions<Constructors> = {}) {}

  readonly encode = <U extends BinarySerializable | CustomTypeOf<Constructors[number]>>(
    item: U,
  ): Uint8Array => {
    this.serializeItem(item)

    const buffer = this.#writer.read()

    // Clear up resources
    this.#references.clear()
    this.#writer = new BufferWriter(...getDefaultOptions(this.options))

    return buffer
  }

  private serializeItem(item: BinarySerializable | CustomTypeOf<Constructors[number]>): number {
    switch (typeof item) {
      case 'string':
        return this.serializeString(item)
      case 'symbol':
        return this.serializeSymbol(item)
      case 'number':
        return this.serializeNumber(item)
      case 'bigint':
        return this.serializeBigInt(item)
      case 'boolean':
        return this.serializeBoolean(item)
      case 'object': {
        if (item === null) {
          return this.serializeNull(item)
        }

        const { constructor } = Object.getPrototypeOf(item)

        switch (constructor) {
          case RegExp:
            return this.serializeRegExp(item as RegExp)
          case Date:
            return this.serializeDate(item as Date)
          case Array:
            return this.serializeArray(item as any)
          case Set:
            return this.serializeSet(item as any)
          case Map:
            return this.serializeMap(item as any)
          default: {
            const n = this.serializeCustom(item as any)

            if (n !== null) {
              return n
            }

            return this.serializeRecord(item as any)
          }
        }
      }

      case 'undefined': {
        return this.serializeUndefined(item)
      }

      default: {
        // Should only happen on Functions
        throw new TypeError(`Unsupported Type: ${JSON.stringify(item)}`)
      }
    }
  }

  /* #region PRIMITIVES */
  private serializeBoolean(item: boolean): number {
    return this.#writer.writeUInt8(item ? SupportedType.True : SupportedType.False)
  }

  private serializeNumber(item: number): number {
    if (Number.isInteger(item)) {
      return item > -1 ? this.serializeUInt(item) : this.serializeInteger(item)
    }

    return this.serializeFloat(item)
  }

  private serializeUInt(integer: number): number {
    return pipe(
      integer,
      matchIntSize(
        () => {
          this.#writer.writeUInt8(SupportedType.UInt8)
          return this.#writer.writeUInt8(integer)
        },
        () => {
          this.#writer.writeUInt8(SupportedType.UInt16)
          return this.#writer.writeUInt16(integer)
        },
        () => {
          this.#writer.writeUInt8(SupportedType.UInt32)
          return this.#writer.writeUInt32(integer)
        },
        () => this.serializeFloat(integer),
      ),
    )
  }

  private serializeInteger(integer: number): number {
    return pipe(
      integer,
      matchIntSize(
        () => {
          this.#writer.writeUInt8(SupportedType.UInt8)
          return this.#writer.writeInt8(integer)
        },
        () => {
          this.#writer.writeUInt8(SupportedType.UInt16)
          return this.#writer.writeInt16(integer)
        },
        () => {
          this.#writer.writeUInt8(SupportedType.UInt32)
          return this.#writer.writeInt32(integer)
        },
        () => this.serializeFloat(integer),
      ),
    )
  }

  private serializeFloat(float: number) {
    this.#writer.writeUInt8(SupportedType.Float)

    return this.#writer.writeDouble(float)
  }

  private serializeNull(_: null) {
    return this.#writer.writeUInt8(SupportedType.Null)
  }

  private serializeUndefined(_: undefined): number {
    return this.#writer.writeUInt8(SupportedType.Undefined)
  }

  private serializeBigInt(item: BigInt): number {
    this.#writer.writeUInt8(SupportedType.BigInt)

    return this.serializeString(item.toString())
  }
  /* #endregion */

  /* #region Referential Data */
  private serializeRegExp(item: RegExp): number {
    return this.getOrTrackReference(item, () => {
      this.#writer.writeUInt8(SupportedType.RegExp)
      this.serializeString(item.source)
      return this.serializeString(item.flags)
    })
  }

  private serializeDate(item: Date): number {
    return this.getOrTrackReference(item, () => {
      this.#writer.writeUInt8(SupportedType.Date)
      return this.serializeInteger(item.getTime())
    })
  }

  private serializeArray(
    items: ReadonlyArray<BinarySerializable | CustomTypeOf<Constructors[number]>>,
  ): number {
    return this.getOrTrackReference(items, () => {
      this.#writer.writeUInt8(SupportedType.ArrayStart)

      items.forEach((i) => this.serializeItem(i))

      return this.#writer.writeUInt8(SupportedType.ArrayEnd)
    })
  }

  private serializeRecord(
    items: Readonly<Record<PropertyKey, BinarySerializable | CustomTypeOf<Constructors[number]>>>,
  ): number {
    return this.getOrTrackReference(items, () => {
      this.#writer.writeUInt8(SupportedType.RecordStart)

      Reflect.ownKeys(items).forEach((k) => {
        this.serializeItem(k)
        this.serializeItem(items[k])
      })

      return this.#writer.writeUInt8(SupportedType.RecordEnd)
    })
  }

  private serializeSet(
    items: ReadonlySet<BinarySerializable | CustomTypeOf<Constructors[number]>>,
  ): number {
    return this.getOrTrackReference(items, () => {
      this.#writer.writeUInt8(SupportedType.SetStart)

      for (const i of items) {
        this.serializeItem(i)
      }

      return this.#writer.writeUInt8(SupportedType.SetEnd)
    })
  }

  private serializeMap(
    items: ReadonlyMap<
      BinarySerializable | CustomTypeOf<Constructors[number]>,
      BinarySerializable | CustomTypeOf<Constructors[number]>
    >,
  ): number {
    return this.getOrTrackReference(items, () => {
      this.#writer.writeUInt8(SupportedType.MapStart)

      for (const [k, v] of items.entries()) {
        this.serializeItem(k)
        this.serializeItem(v)
      }

      return this.#writer.writeUInt8(SupportedType.MapEnd)
    })
  }

  private serializeString(item: string): number {
    const refNumber = this.getOrTrackReference(item, () => {
      this.#writer.writeUInt8(SupportedType.String)

      const encoded = utf8ToBytes(item)

      this.serializeUInt(encoded.byteLength)

      return this.#writer.writeString(encoded)
    })

    if (refNumber !== null) {
      return refNumber
    }

    this.#writer.writeUInt8(SupportedType.String)

    const encoded = utf8ToBytes(item)

    this.serializeUInt(encoded.byteLength)

    const offset = this.#writer.writeString(encoded)

    return offset
  }

  private serializeSymbol(item: symbol): number {
    return this.getOrTrackReference(item, () => {
      const key = Symbol.keyFor(item)

      if (key) {
        this.#writer.writeUInt8(SupportedType.SymbolFor)

        return this.serializeString(key)
      }

      const description = item.description

      if (description) {
        this.#writer.writeUInt8(SupportedType.SymbolDescription)

        return this.serializeString(description)
      }

      return this.#writer.writeUInt8(SupportedType.Symbol)
    })
  }

  private serializeRef(offset: number): number {
    this.#writer.writeUInt8(SupportedType.Ref)

    return this.serializeUInt(offset)
  }

  private serializeCustom(item: unknown): number | null {
    if (!this.options.constructors) {
      return null
    }

    for (const { id, is, encode } of this.options.constructors) {
      if (is(item)) {
        return this.getOrTrackReference(item, () => {
          this.#writer.writeUInt8(SupportedType.CustomStart)
          this.serializeItem(id)
          this.serializeItem(encode(item))

          return this.#writer.writeUInt8(SupportedType.CustomEnd)
        })
      }
    }

    return null
  }
  /* #endregion */

  private getOrTrackReference(item: BinarySerializable, f: () => number): number {
    if (this.#references.has(item)) {
      return this.serializeRef(this.#references.get(item)!)
    }

    this.#references.set(item, this.#writer.offset)

    return f()
  }
}

function getDefaultOptions<Constructors extends ReadonlyArray<CustomConstructor<any, any>>>(
  options: BinaryEncoderOptions<Constructors>,
) {
  return [
    options.growthIncrement ?? DEFAULT_GROWTH_INCREMENT,
    options.maxSize ?? MEMORY_UPPER_BOUND,
    options.shared ?? true,
  ] as const
}

function matchIntSize<A, B, C, D>(
  on8: (n: number) => A,
  on16: (n: number) => B,
  on32: (n: number) => C,
  on64: (n: number) => D,
) {
  return (byteLength: number) => {
    if (byteLength < 0x100) {
      return on8(byteLength)
    }

    if (byteLength < 0x10000) {
      return on16(byteLength)
    }

    if (byteLength < 0x100000000) {
      return on32(byteLength)
    }

    return on64(byteLength)
  }
}
