/* eslint-disable @typescript-eslint/ban-types */

import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import type { ParseOptions } from '@effect/schema/AST'
import { ParseError } from '@effect/schema/ParseResult'
import * as Schema from '@effect/schema/Schema'
import * as Fx from '@typed/fx'

import { ElementRef, makeElementRef } from './ElementRef.js'
import { EventHandler } from './EventHandler.js'
import { html, svg } from './RenderTemplate.js'
import { Rendered } from './render.js'

export interface ComponentInput<T extends HTMLElement> {
  readonly ref: ElementRef<T>
  readonly html: typeof html
  readonly svg: typeof svg
  readonly event: typeof EventHandler

  readonly useState: {
    <R, E, A>(effect: Effect.Effect<R, E, A>, options: UseStateOptions<A>): Effect.EffectGen<
      R | Scope.Scope,
      never,
      Fx.RefSubject<E | ParseError, A>
    >

    <R, E, A extends Schema.Json>(
      effect: Effect.Effect<R, E, A>,
      options?: UseStateJsonOptions<A>,
    ): Effect.EffectGen<R | Scope.Scope, never, Fx.RefSubject<E | ParseError, A>>
  }
}

export function componentAs$<T extends HTMLElement>() {
  return <Y extends Effect.EffectGen<any, any, any>, R, E>(
    f: ($: Effect.Adapter & ComponentInput<T>) => Generator<Y, Fx.Fx<R, E, Rendered>>,
  ): Fx.Fx<R | Scope.Scope | Fx.EffectGenResources<Y>, E | Fx.EffectGenErrors<Y>, Rendered> => {
    return Fx.gen(function* ($) {
      const data = yield* $(Fx.makeRef<never, never, {}>(Effect.Do()))
      const index = yield* $(Fx.makeRef<never, never, number>(Effect.succeed(0)))
      const ref = yield* $(makeElementRef<T>())

      const input: ComponentInput<T> = {
        ref,
        html,
        svg,
        event: EventHandler,
        useState: useState(ref, data, index, $) as ComponentInput<T>['useState'],
      }

      yield* $(
        ref.element,
        Fx.combine(data),
        // TODO: Do better diffing of dataset
        Fx.tapSync(([element, data]) => Object.assign(element.dataset, data)),
        Fx.drain,
        Effect.forkScoped,
      )

      // Use .bind to create a clone of Effect.Adapter
      const rendered = yield* f(Object.assign($.bind({}), input))

      return rendered as Fx.Fx<R, E, T>
    })
  }
}

export const component$ = componentAs$<HTMLElement>()

export interface UseStateOptions<A> {
  readonly schema: Schema.Schema<string, A>
  readonly key?: string
  readonly parseOptions?: ParseOptions
}

export interface UseStateJsonOptions<A> {
  readonly schema?: Schema.Schema<string, A>
  readonly key?: string
  readonly parseOptions?: ParseOptions
}

const defaultSchema = Schema.transform(Schema.string, Schema.json, JSON.parse, JSON.stringify)

export function useState<T extends HTMLElement>(
  element: ElementRef<T>,
  data: Fx.RefSubject<never, {}>,
  index: Fx.RefSubject<never, number>,
  $: Effect.Adapter,
) {
  const getNextIndex = index.modify((i) => [i, i + 1])

  return <R, E, A>(
    initial: Effect.Effect<R, E, A>,
    options?: UseStateOptions<A>,
  ): Effect.EffectGen<Scope.Scope | R, never, Fx.RefSubject<E | ParseError, A>> =>
    $(
      Effect.gen(function* ($) {
        const schema = options?.schema ?? (defaultSchema as unknown as Schema.Schema<string, A>)
        const key = options?.key ?? (yield* $(getNextIndex)).toString()
        const el = yield* $(element)
        const effect = pipe(
          el,
          Option.match(
            () => initial,
            (el) => {
              const val = el.dataset[key]

              if (val === undefined) {
                return initial
              }

              let first = true

              return Effect.suspend(
                Effect.unifiedFn(() => {
                  if (first) {
                    first = false

                    return Schema.decodeEffect(schema)(val, options?.parseOptions)
                  }

                  return initial
                }),
              )
            },
          ),
        )
        const ref = yield* $(Fx.makeRef<R, E | ParseError, A>(effect))

        // Listen to all changes to our ref and add to data for serialization
        yield* $(
          ref,
          Fx.switchMapEffect((a) => Schema.encodeEffect(schema)(a, options?.parseOptions)),
          Fx.observe((a) => data.update((d) => ({ ...d, [key]: a }))),
          Effect.forkScoped,
        )

        return ref
      }),
    )
}
