export * from './interpreter'
export * from './TypedSchema'
export type { TypedSchemable, TypedSchemable1, TypedSchemable2C } from './TypedSchemable'

import { Schemable as Decoder } from './Decoder'
import { Schemable as Eq } from './Eq'
import { Schemable as Guard } from './Guard'
import { createInterpreter } from './interpreter'
import { Schemable as JsonSchema } from './JsonSchema'

export { JsonCodec, JsonDecoder, JsonEncoder } from './JsonCodec'

export const createDecoder = createInterpreter(Decoder)
export const createEq = createInterpreter(Eq)
export const createGuard = createInterpreter(Guard)
export const createJsonSchema = createInterpreter(JsonSchema)
