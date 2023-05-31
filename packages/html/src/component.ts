/* eslint-disable @typescript-eslint/ban-types */

import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import type { ParseOptions } from '@effect/schema/AST'
import { ParseError } from '@effect/schema/ParseResult'
import * as Schema from '@effect/schema/Schema'
import * as Fx from '@typed/fx'

import { Directive, nodeDirective } from './Directive.js'
import { ElementRef, unsafeMakeElementRef } from './ElementRef.js'
import { EventHandler } from './EventHandler.js'
import { html, svg } from './RenderTemplate.js'
import { getElementsFromRendered } from './getElementsFromRendered.js'
import { Rendered } from './render.js'

export interface ComponentInput<T extends Rendered> {
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

export function componentAs<T extends Rendered>() {
  return <Y extends Effect.EffectGen<any, any, any>, R, E>(
    f: ($: Effect.Adapter & ComponentInput<T>) => Generator<Y, Fx.Fx<R, E, Rendered>>,
  ): Effect.Effect<
    never,
    never,
    Component<R | Scope.Scope | Fx.EffectGenResources<Y>, E | Fx.EffectGenErrors<Y>, T>
  > => {
    return Effect.sync(() => {
      const ref = unsafeMakeElementRef<T>()
      const render = Fx.gen(function* ($) {
        const data = yield* $(Fx.makeRef<never, never, {}>(Effect.succeed({ typed: 'true' })))
        const index = yield* $(Fx.makeRef<never, never, number>(Effect.succeed(0)))

        const input: ComponentInput<T> = {
          ref,
          html,
          svg,
          event: EventHandler,
          useState: useState(ref, data, index, $) as ComponentInput<T>['useState'],
        }

        yield* $(
          ref.element,
          Fx.map(getComponentElement),
          Fx.combine(data),
          Fx.tapSync(([element, data]) => {
            if (element && 'dataset' in element) {
              Object.assign(element.dataset as {}, data)
            }
          }),
          Fx.drain,
          Effect.forkScoped,
        )

        // Use .bind to create a clone of Effect.Adapter
        const rendered = yield* f(Object.assign($.bind({}), input))

        return rendered as Fx.Fx<R, E, T>
      })

      return Object.assign(render, { ref })
    })
  }
}

export const component = Object.assign(componentAs<HTMLElement>(), {
  as: componentAs,
})

export interface UseStateOptions<A> {
  readonly key?: string
  readonly schema: Schema.Schema<string, A>
  readonly parseOptions?: ParseOptions
}

export interface UseStateJsonOptions<A> {
  readonly key?: string
  readonly schema?: Schema.Schema<string, A>
  readonly parseOptions?: ParseOptions
}

const defaultSchema = Schema.transform(Schema.string, Schema.json, JSON.parse, JSON.stringify)

function useState<T extends Rendered>(
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
        const encode = Schema.encodeEffect(schema)
        const decode = Schema.decodeEffect(schema)

        const initializeState = pipe(
          yield* $(element),
          Option.match(
            () => initial,
            (rendered) => {
              const element = getComponentElement(rendered)

              if (element === undefined) {
                return initial
              }

              const val = (element as any).dataset?.[key]

              if (val === undefined) {
                return initial
              }

              let first = true

              return Effect.suspend(
                Effect.unifiedFn(() => {
                  if (first) {
                    first = false

                    return decode(val, options?.parseOptions)
                  }

                  return initial
                }),
              )
            },
          ),
        )
        const ref = yield* $(Fx.makeRef<R, E | ParseError, A>(initializeState))

        // Listen to all changes to our ref and add to data for serialization
        yield* $(
          ref,
          Fx.switchMapEffect((a) => encode(a, options?.parseOptions)),
          Fx.observe((a) => data.update((d) => ({ ...d, [key]: a }))),
          Effect.forkScoped,
        )

        return ref
      }),
    )
}

export interface Component<R, E, A extends Rendered> extends Fx.Fx<R, E, A> {
  readonly ref: ElementRef<A>
}

export function asDirective<R, E, A extends Rendered>(
  component: Component<R, E, A>,
): Directive<R | Scope.Scope, E> {
  return nodeDirective((part) =>
    Effect.gen(function* ($) {
      const root = getPreviousComponentElement(part.comment)

      if (root) {
        yield* $(component.ref.set(Option.some(root as any as A)))
      }

      // Let changes be placed in the part
      yield* $(pipe(component.ref.element, Fx.tapSync(part.update), Fx.drain, Effect.forkScoped))
    }),
  )
}

function getComponentElement(rendered: Rendered) {
  return getElementsFromRendered(rendered).find(isTypedElement) || rendered
}

function isTypedElement(element: Rendered): element is HTMLElement {
  return !!(
    'dataset' in element &&
    typeof element.dataset === 'object' &&
    (element as any).dataset?.['typed'] === 'true'
  )
}

function getPreviousComponentElement(comment: Comment) {
  let prev = comment.previousElementSibling

  while (prev && !isTypedElement(prev)) {
    prev = prev.previousElementSibling
  }

  return prev
}
