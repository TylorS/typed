import { isNonEmptyReadonlyArray } from '@effect/data/ReadonlyArray'
import type { ReadonlyRecord } from '@effect/data/ReadonlyRecord'
import type { ParseOptions } from '@fp-ts/schema/AST'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import type { Decoder, InputOf, OutputOf } from './decoder.js'
import { unknownRecord } from './record.js'

export interface StructDecoder<P extends ReadonlyRecord<Decoder<any, any>>>
  extends Decoder<
    unknown,
    {
      readonly [K in keyof P]: OutputOf<P[K]>
    }
  > {
  readonly properties: P
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type PropertiesOf<T> = T extends StructDecoder<infer P> ? P : never

export function struct<P extends ReadonlyRecord<Decoder<unknown, any>>>(
  properties: P,
): StructDecoder<P> {
  return Object.assign(
    (i: InputOf<StructDecoder<P>>, options?: ParseOptions) => {
      const recordResult = unknownRecord(i, options)

      if (ParseResult.isFailure(recordResult)) {
        return recordResult
      }

      const input = recordResult.right as {
        readonly [K in keyof P]: InputOf<P[K]>
      }
      const keys = Reflect.ownKeys(properties) as (keyof P)[]
      const failures: ParseResult.ParseError[] = []
      const successes: Partial<Record<keyof P, any>> = {}
      for (const key of keys) {
        const property = properties[key]

        if (!property) continue

        const result = property(input[key], options)

        if (ParseResult.isFailure(result)) {
          failures.push(ParseResult.key(key, result.left))
        } else {
          successes[key] = result.right
        }
      }

      if (isNonEmptyReadonlyArray(failures)) {
        return ParseResult.failures(failures)
      }

      return ParseResult.success(successes as any)
    },
    { properties },
  )
}

export const extend =
  <D2 extends StructDecoder<any>>(second: D2) =>
  <D1 extends StructDecoder<any>>(
    first: D1,
  ): StructDecoder<Flatten<Omit<PropertiesOf<D1>, keyof PropertiesOf<D2>> & PropertiesOf<D2>>> =>
    struct({ ...first.properties, ...second.properties })

export const pick =
  <P extends ReadonlyRecord<Decoder<any, any>>, Keys extends ReadonlyArray<keyof P>>(
    ...keys: Keys
  ) =>
  (decoder: StructDecoder<P>): StructDecoder<PickFlatten<P, Keys>> =>
    struct(
      Object.fromEntries(Object.entries(decoder.properties).filter(([key]) => keys.includes(key))),
    ) as StructDecoder<PickFlatten<P, Keys>>

export const omit =
  <P extends ReadonlyRecord<Decoder<any, any>>, Keys extends ReadonlyArray<keyof P>>(
    ...keys: Keys
  ) =>
  (decoder: StructDecoder<P>): StructDecoder<OmitFlatten<P, Keys>> =>
    struct(
      Object.fromEntries(Object.entries(decoder.properties).filter(([key]) => !keys.includes(key))),
    ) as StructDecoder<OmitFlatten<P, Keys>>

type PickFlatten<
  P extends ReadonlyRecord<Decoder<any, any>>,
  Keys extends ReadonlyArray<keyof P>,
> = Flatten<Pick<P, Keys[number]>>

type OmitFlatten<
  P extends ReadonlyRecord<Decoder<any, any>>,
  Keys extends ReadonlyArray<keyof P>,
> = Flatten<Omit<P, Keys[number]>>

type Flatten<T> = [T] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
