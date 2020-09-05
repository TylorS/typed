export * from './interpreter'
export * from './TypedSchemable'
export * from './TypedSchema'

import { Schemable as Codec } from './Codec'
import { Schemable as Decoder } from './Decoder'
import { Schemable as Eq } from './Eq'
import { Schemable as Guard } from './Guard'
import { createInterpreter } from './interpreter'

export const createCodecFromSchema = createInterpreter(Codec)
export const createDecoderFromSchema = createInterpreter(Decoder)
export const createEqFromSchema = createInterpreter(Eq)
export const createGuardFromSchema = createInterpreter(Guard)
