export * from './interpreter'
export type { TypedSchemable, TypedSchemable1, TypedSchemable2C } from './TypedSchemable'
export * from './TypedSchema'

import { Schemable as Decoder } from './Decoder'
import { Schemable as Eq } from './Eq'
import { Schemable as Guard } from './Guard'
import { createInterpreter } from './interpreter'

export const createDecoderFromSchema = createInterpreter(Decoder)
export const createEqFromSchema = createInterpreter(Eq)
export const createGuardFromSchema = createInterpreter(Guard)
