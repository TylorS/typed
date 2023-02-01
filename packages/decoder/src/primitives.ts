import { flow } from '@fp-ts/core/Function'
import * as Option from '@fp-ts/core/Option'
import * as S from '@fp-ts/schema/Schema'

import { fromSchema, type Decoder, type SchemaDecoder } from './decoder.js'

export const literal = flow(S.literal, fromSchema)
export const uniqueSymbol = flow(S.uniqueSymbol, fromSchema)
export const enums = flow(S.enums, fromSchema)
export const never = fromSchema(S.never)
export const unknown = fromSchema(S.unknown)
export const any = fromSchema(S.any)
export const string = fromSchema(S.string)
export const number = fromSchema(S.number)
export const boolean = fromSchema(S.boolean)
export const bigint = fromSchema(S.bigint)
export const symbol = fromSchema(S.symbol)
export const object = fromSchema(S.object)
export const date = fromSchema(S.date)

const null_ = fromSchema(S.null)
const undefined_ = fromSchema(S.undefined)
const void_ = fromSchema(S.void)

export { null_ as null, undefined_ as undefined, void_ as void }

export const instanceOf = <A extends abstract new (...args: any) => any>(
  constructor: A,
  annotationOptions?: S.AnnotationOptions<object>,
): SchemaDecoder<InstanceType<A>> =>
  fromSchema(S.instanceOf(constructor, annotationOptions)(S.object))

export const lazy = <I, O>(f: () => Decoder<I, O>): Decoder<I, O> => {
  let memoized: Option.Option<Decoder<I, O>> = Option.none()

  const get = () => {
    if (Option.isSome(memoized)) {
      return memoized.value
    }

    const x = f()

    memoized = Option.some(x)

    return x
  }

  return {
    decode: (i, options) => get().decode(i, options),
  }
}
