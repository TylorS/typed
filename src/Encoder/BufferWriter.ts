import { Buffer } from './Buffer'

/**
 * Abstraction for writing to a Buffer backed by WebAssembly.Memory
 * Support for Node + Browser environemnts with WebAssembly is required for usage.
 */
export class BufferWriter {
  // Internal state kept during serialization
  #offset: number = 0
  #memory: WebAssembly.Memory
  #buffer: Buffer

  /** BUFFER WRITERS */

  constructor(
    readonly growthIncrement: number,
    readonly maxSize: number,
    readonly shared: boolean,
  ) {
    this.#memory = new WebAssembly.Memory({
      initial: this.growthIncrement,
      maximum: this.maxSize,
      shared: this.shared,
    })

    this.#buffer = Buffer.from(this.#memory.buffer)
  }

  public get offset() {
    return this.#offset
  }

  public get memory() {
    return this.#memory
  }

  public get buffer() {
    return this.#buffer
  }

  public read = () => this.#buffer.slice(0, this.#offset)

  public writeUInt8 = (uInt8: number) => {
    return this.growMemoryWith(1, (offset) => this.#buffer.writeUInt8(uInt8, offset))
  }

  public writeUInt16 = (uInt16: number) => {
    return this.growMemoryWith(2, (offset) => this.#buffer.writeUInt16LE(uInt16, offset))
  }

  public writeUInt32 = (uInt32: number) => {
    return this.growMemoryWith(4, (offset) => this.#buffer.writeUInt32LE(uInt32, offset))
  }

  public writeInt8 = (int8: number) => {
    return this.growMemoryWith(1, (offset) => this.#buffer.writeInt8(int8, offset))
  }

  public writeInt16 = (int16: number) => {
    return this.growMemoryWith(2, (offset) => this.#buffer.writeInt16LE(int16, offset))
  }

  public writeInt32 = (int32: number) => {
    return this.growMemoryWith(4, (offset) => this.#buffer.writeInt32LE(int32, offset))
  }

  public writeDouble = (double: number) => {
    return this.growMemoryWith(8, (offset) => this.#buffer.writeDoubleLE(double, offset))
  }

  public writeString = (encoded: Uint8Array) => {
    const { byteLength } = encoded

    return this.growMemoryWith(byteLength, (offset) => {
      for (let i = 0; i < byteLength; ++i) {
        this.#buffer[offset + i] = encoded[i]
      }

      return offset + byteLength
    })
  }

  private growMemoryWith(growth: number, f: (offset: number) => number): number {
    const current = this.#offset

    this.#offset = this.growMemory(growth, f)

    return this.#offset - current
  }

  private growMemory<A>(growth: number, f: (offset: number) => A): A {
    const current = this.#offset
    const expected = current + growth
    const byteLength = this.#memory.buffer.byteLength

    if (byteLength < expected) {
      const difference = expected - byteLength

      // Ensure we grow enough to fit our needs
      let growth = this.growthIncrement
      while (growth < difference) {
        growth += this.growthIncrement
      }

      this.#memory.grow(Math.min(growth, this.maxSize))
      this.#buffer = Buffer.from(this.#memory.buffer)
    }

    return f(current)
  }
}
