import { SupportedType } from './BinaryShared'
import { Buffer } from './Buffer'

export type NumberEncoding =
  | SupportedType.UInt8
  | SupportedType.UInt16
  | SupportedType.UInt32
  | SupportedType.Int8
  | SupportedType.Int16
  | SupportedType.Int32
  | SupportedType.Float

export class BufferReader {
  #offset: number = 0
  #buffer: Buffer

  constructor(readonly input: ArrayBuffer) {
    this.#buffer = Buffer.from(input)
  }

  get offset() {
    return this.#offset
  }

  private increment = (n: number) => {
    const c = this.#offset

    this.#offset += n

    return c
  }

  readUInt8 = () => this.#buffer.readUInt8(this.increment(1))
  readUInt16 = () => this.#buffer.readUInt16LE(this.increment(2))
  readUInt32 = () => this.#buffer.readUInt32LE(this.increment(4))
  readInt8 = () => this.#buffer.readInt8(this.increment(1))
  readInt16 = () => this.#buffer.readInt16LE(this.increment(2))
  readInt32 = () => this.#buffer.readInt32LE(this.increment(4))
  readDouble = () => this.#buffer.readDoubleLE(this.increment(8))

  readString = (): string => {
    const byteLengthEncoding = this.readUInt8() as NumberEncoding | SupportedType.String

    if (byteLengthEncoding === SupportedType.String) {
      return this.readString()
    }

    const byteLength = this.#readByteLength[byteLengthEncoding]()
    const s = this.#buffer.slice(this.#offset, this.#offset + byteLength)

    this.#offset += byteLength

    return s.toString('utf-8')
  }

  #readByteLength: Record<NumberEncoding, () => number> = {
    [SupportedType.UInt8]: () => this.readUInt8(),
    [SupportedType.UInt16]: () => this.readUInt16(),
    [SupportedType.UInt32]: () => this.readUInt32(),
    [SupportedType.Int8]: () => this.readInt8(),
    [SupportedType.Int16]: () => this.readInt16(),
    [SupportedType.Int32]: () => this.readInt32(),
    [SupportedType.Float]: () => this.readDouble(),
  }
}
