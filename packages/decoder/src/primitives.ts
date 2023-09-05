import * as Option from "@effect/data/Option"
import type * as AST from "@effect/schema/AST"
import * as Parser from "@effect/schema/Parser"
import * as S from "@effect/schema/Schema"

import { Decoder } from "./Decoder"
import { union } from "./union"

export interface SchemaDecoder<From, To = From> extends S.Schema<From, To>, Decoder<unknown, To> {}

export function fromSchema<From, To>(schema: S.Schema<From, To>): SchemaDecoder<From, To> {
  return Object.assign(Parser.validate(schema), schema)
}

export const literal = <Literals extends ReadonlyArray<AST.LiteralValue>>(
  ...a: Literals
): SchemaDecoder<Literals[number]> => fromSchema(S.literal(...a))
export const uniqueSymbol = <S extends symbol>(
  symbol: S,
  annotations?: Record<string | symbol, unknown> | undefined
) => fromSchema(S.uniqueSymbol(symbol, annotations))

export const enums = <
  A extends {
    [x: string]: string | number
  }
>(
  enums: A
) => fromSchema(S.enums(enums))
export const never = fromSchema(S.never)
export const unknown = fromSchema(S.unknown)
export const any = fromSchema(S.any)
export const string = fromSchema(S.string)
export const number = fromSchema(S.number)
export const boolean = fromSchema(S.boolean)
export const bigint = fromSchema(S.bigint)
export const symbol = fromSchema(S.symbol)
export const object = fromSchema(S.object)
export const Date = fromSchema(S.Date)

const null_ = fromSchema(S.null)
const undefined_ = fromSchema(S.undefined)
const void_ = fromSchema(S.void)

export { null_ as null, undefined_ as undefined, void_ as void }

export const instanceOf = <A extends abstract new(...args: any) => any>(
  constructor: A,
  annotationOptions?: S.AnnotationOptions<object>
): SchemaDecoder<InstanceType<A>> => fromSchema(S.instanceOf(constructor, annotationOptions))

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

  return Decoder<I, O>((i, options) => get()(i, options))
}

export const optional = <A>(member: Decoder<unknown, A>): Decoder<unknown, A | undefined> => union(member, undefined_)

export const nullable = <A>(member: Decoder<unknown, A>): Decoder<unknown, A | null> => union(member, null_)
