import * as Either from '@effect/data/Either'
import { isNonEmptyReadonlyArray } from '@effect/data/ReadonlyArray'
import type { ReadonlyRecord } from '@effect/data/ReadonlyRecord'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

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
    (i: InputOf<StructDecoder<P>>, options?: ParseOptions) =>
      Effect.gen(function* ($) {
        const input = (yield* $(ParseResult.effect(unknownRecord(i, options)))) as {
          readonly [K in keyof P]: InputOf<P[K]>
        }
        const keys = Reflect.ownKeys(properties) as (keyof P)[]
        const failures: ParseResult.ParseErrors[] = []
        const successes: Partial<Record<keyof P, any>> = {}

        // Handle required properties
        for (const key of keys) {
          const property = properties[key]

          if (!property) continue

          if (options?.errors === 'first') {
            successes[key] = yield* $(ParseResult.effect(property(input[key], options)))
          } else {
            const either = yield* $(
              Effect.either(ParseResult.effect(property(input[key], options))),
            )

            if (Either.isLeft(either)) {
              failures.push(ParseResult.key(key, either.left.errors))
            } else {
              successes[key] = either.right
            }
          }
        }

        // Handle excess properties
        if (options?.onExcessProperty === 'error') {
          const excessProperties = Object.keys(input).filter(
            (key) => keys.includes(key),
          )

          for (const key of excessProperties) {
            failures.push(ParseResult.key(key, [ParseResult.unexpected(input[key])]))
          }
        }

        if (isNonEmptyReadonlyArray(failures)) {
          return yield* $(Effect.fail(ParseResult.parseError(failures)))
        }

        return successes as any
      }),
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
