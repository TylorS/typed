import { Buffer as BufferShim } from 'buffer'

const Shim = typeof Buffer === 'undefined' ? BufferShim : Buffer

export { Shim as Buffer }
