import { deepStrictEqual, ok } from 'assert'

import * as Debug from '@effect/data/Debug'
import * as Duration from '@effect/data/Duration'
import { flow, pipe } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Fiber from '@effect/io/Fiber'
import { NumberFromString } from '@effect/schema/Schema'
import { makeDomServices } from '@typed/dom'
import { ServerWindowOptions, makeServerWindow } from '@typed/framework/makeServerWindow.js'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { RenderContext } from './RenderContext.js'
import { Component, component } from './component.js'
import { dom } from './dom.js'
import { getElementsFromRendered } from './getElementsFromRendered.js'
import { stripHoleComments } from './parseTemplate.js'
import { Rendered } from './render.js'

describe(import.meta.url, () => {
  describe(component.name, () => {
    it('serializes state to data attributes', async () => {
      const test = Effect.gen(function* ($) {
        const counter = component(function* ($) {
          const { html, ref, useState } = $

          const count = yield* useState(Effect.succeed<number>(0), {
            // Optionally provide a key to use for the data attribute
            // When provided, you are not subjected to the "rules of hooks".
            key: 'count',
            // Optionally provide a schema to use for parsing the data attribute
            // Required when your state is not already JSON serializable
            schema: NumberFromString,
          })

          return html`<div ref="${ref}" onclick=${count.update((x) => x + 1)}>${count}</div>`
        })

        const { window, getElement, waitForRender, dispatchEvent } = yield* $(
          testComponent(counter),
        )

        const element = yield* $(getElement())

        // Ensure we have the correct element
        ok(element instanceof window.HTMLDivElement)

        // Test html content + data attributes
        deepStrictEqual(element.dataset['count'], '0')

        // waitForRender adds a listener to the next render, executes the provided
        // effect, and then waits for the next render to finish before returning
        // the result of the provided effect.
        yield* $(waitForRender(Effect.sync(() => element.click())))

        // Test data updated after click
        deepStrictEqual(element.dataset['count'], '1')

        // By default dispatch event will use the root element's
        // dispatchEvent and wait on the next render
        yield* $(dispatchEvent({ eventName: 'click' }))

        // Optionally you can specify the element to dispatch the event on
        yield* $(dispatchEvent({ eventName: 'click', element }))

        // Test data updated after 2 clicks
        deepStrictEqual(element.dataset['count'], '3')
      })

      await Effect.runPromise(Effect.scoped(test))
    })
  })
})

interface TestOptions extends ServerWindowOptions {
  readonly timeout?: Duration.Duration
}

function testComponent<R0, E0, R, E, A extends Rendered>(
  createComponent: Effect.Effect<R0, E0, Component<R, E, A>>,
  testOptions?: TestOptions,
) {
  const window = makeServerWindow(testOptions)

  return pipe(
    Effect.gen(function* ($) {
      const component = yield* $(createComponent)
      const timeout = testOptions?.timeout ?? Duration.seconds(1)
      let waiters: Array<Deferred.Deferred<E, void>> = []
      const id = yield* $(Effect.fiberId())

      const wait = Effect.suspend(() => {
        const deferred = Deferred.unsafeMake<E, void>(id)

        waiters.push(deferred)

        return Effect.race(
          Deferred.await(deferred),
          Effect.delay(
            Effect.dieMessage(`Render did not complete in ${timeout.millis}ms`),
            timeout,
          ),
        )
      })

      const done = (exit: Exit.Exit<E, void>) =>
        Effect.suspend(() => {
          const clone = waiters.slice(0)

          waiters = []

          return Effect.allPar(clone.map((waiter) => Deferred.done(waiter, exit)))
        })

      // Run our component in a non-blocking way
      yield* $(
        component,
        Fx.observe(() => done(Exit.unit())),
        Effect.catchAllCause((cause) => done(Exit.failCause(cause))),
        Effect.forkScoped,
      )

      // Let fibers start
      const firstRender = yield* $(Effect.forkScoped(wait))
      const ensureFirstRender = Fiber.join(firstRender)

      const getElement = Effect.gen(function* ($) {
        yield* $(ensureFirstRender)

        const element = yield* $(component.ref.getElement)

        if (element.nodeType === element.ELEMENT_NODE) {
          return element as A extends Element ? A : Element
        }

        throw new Error('Element not found')
      })

      const getElements = Effect.gen(function* ($) {
        yield* $(ensureFirstRender)

        const element = yield* $(component.ref.getElement)

        return getElementsFromRendered(element)
      })

      const getOuterHtml = Effect.gen(function* ($) {
        yield* $(ensureFirstRender)

        const element = yield* $(getElement)

        return stripHoleComments(element.outerHTML)
      })

      const getInnerHtml = Effect.gen(function* ($) {
        yield* $(ensureFirstRender)

        const element = yield* $(getElement)

        return stripHoleComments(element.innerHTML)
      })

      const dispatchEvent = ({
        element: inputElement,
        eventName,
        init,
      }: {
        element?: Element
        eventName: string
        init?: EventInit
      }) =>
        Effect.gen(function* ($) {
          yield* $(ensureFirstRender)

          const element = inputElement || (yield* $(getElement))
          const event = new window.Event(eventName, init)
          const fiber = yield* $(Effect.forkScoped(wait))

          yield* $(Effect.sleep(Duration.millis(1)))

          element.dispatchEvent(event)

          // Let UI update
          return yield* $(Fiber.join(fiber))
        })

      const waitForRender = <R = never, E = never, A = void>(
        effect: Effect.Effect<R, E, A> = Effect.unit() as any,
      ) =>
        Effect.gen(function* ($) {
          const fiber = yield* $(Effect.forkScoped(wait))
          const a = yield* $(effect)

          yield* $(Fiber.join(fiber))

          return a
        })

      return {
        window,
        ref: component.ref,
        getElement: Debug.methodWithTrace((trace) => () => getElement.traced(trace)),
        getElements: Debug.methodWithTrace((trace) => () => getElements.traced(trace)),
        getOuterHtml: Debug.methodWithTrace((trace) => () => getOuterHtml.traced(trace)),
        getInnerHtml: Debug.methodWithTrace((trace) => () => getInnerHtml.traced(trace)),
        dispatchEvent: Debug.methodWithTrace((trace) =>
          flow(dispatchEvent, (x) => x.traced(trace)),
        ),
        waitForRender: Debug.methodWithTrace((trace) =>
          flow(waitForRender, (x) => x.traced(trace)),
        ),
      } as const
    }),
    Effect.provideSomeLayer(dom),
    RenderContext.provide(RenderContext.make('test')),
    Effect.provideSomeContext(makeDomServices(window, window)),
  )
}
