import { deepEqual, deepStrictEqual } from 'assert'

import * as Effect from '@effect/core/io/Effect'
import * as Fiber from '@effect/core/io/Fiber'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { DomSource, EventDelegationDomSource } from './DomSource.js'

import { makeServerWindow } from '@/Server/DomServices.js'

describe(import.meta.url, () => {
  describe('query', () => {
    it('appends selectors to a DomSource with the given selector', () => {
      const { selectors } = EventDelegationDomSource(Fx.never).query('.foo').query('.bar')

      deepStrictEqual(selectors, ['.foo', '.bar'])
    })

    it('does not append the root selector', () => {
      const { selectors } = EventDelegationDomSource(Fx.never).query('.foo').query(':root')

      deepStrictEqual(selectors, ['.foo'])
    })
  })

  describe(`elements`, () => {
    describe(`given a DomSource with a stream of element and empty CSS selectors`, () => {
      it(`returns a stream of elements with only the root element`, async () => {
        const win = makeServerWindow()
        const rootEl = win.document.createElement('div')
        const sut: DomSource = EventDelegationDomSource(Fx.succeed(rootEl), [])
        const test = pipe(sut.elements, Fx.take(1), Fx.runCollect)
        const events = await Effect.unsafeRunPromise(test)

        deepStrictEqual(events, [[rootEl]])
      })
    })

    describe(`given a DomSource with a stream of element with queried CSS selectors`, () => {
      it(`returns a stream of elements with only the most specific elements`, async () => {
        const { document } = makeServerWindow()
        const rootEl = document.createElement('div')
        const childEl = document.createElement('div')

        rootEl.classList.add(`foo`)
        childEl.classList.add(`foo`)
        rootEl.appendChild(childEl)

        const sut: DomSource = EventDelegationDomSource(Fx.succeed(rootEl), [`.foo`])
        const test = pipe(sut.elements, Fx.take(1), Fx.runCollect)
        const events = await Effect.unsafeRunPromise(test)

        deepStrictEqual(events, [[rootEl, childEl]])
      })
    })

    describe(`given a DomSource with a stream of element with children matching CSS selectors`, () => {
      it(`returns a stream of elements with only the most specific elements`, async () => {
        const { document } = makeServerWindow()
        const rootEl = document.createElement('div')
        const childEl = document.createElement('div')

        childEl.classList.add(`foo`)
        rootEl.appendChild(childEl)

        const sut: DomSource = EventDelegationDomSource(Fx.succeed(rootEl), [`.foo`])
        const test = pipe(sut.elements, Fx.take(1), Fx.runCollect)
        const events = await Effect.unsafeRunPromise(test)

        deepStrictEqual(events, [[childEl]])
      })
    })

    describe(`given a DomSource with a stream of element with non-matching CSS selectors`, () => {
      it(`returns a stream of elements with only the most specific elements`, async () => {
        const { document } = makeServerWindow()
        const rootEl = document.createElement('div')
        const childEl = document.createElement('div')

        childEl.classList.add(`foo`)
        rootEl.appendChild(childEl)

        const sut: DomSource = EventDelegationDomSource(Fx.succeed(rootEl), [`.bar`])
        const test = pipe(sut.elements, Fx.take(1), Fx.runCollect)
        const events = await Effect.unsafeRunPromise(test)

        deepStrictEqual(events, [])
      })
    })
  })

  describe('events', () => {
    describe('an event type', () => {
      it(`returns a stream of events of same event type`, async () => {
        const win = makeServerWindow()
        const rootEl = win.document.createElement('div')
        const sut: DomSource = EventDelegationDomSource(Fx.succeed(rootEl), [])
        const eventType = 'click'
        const event = new win.Event(eventType)

        const test = Effect.gen(function* ($) {
          const fiber = yield* $(
            pipe(sut.events(eventType), Fx.take(2), Fx.runCollect, Effect.fork),
          )

          yield* $(Effect.sleep(millis(0)))

          rootEl.dispatchEvent(event)
          rootEl.dispatchEvent(event)

          const events = yield* $(Fiber.join(fiber))

          deepEqual(events, [event, event])
        })

        await Effect.unsafeRunPromise(test)
      })
    })
  })
})
