import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Context } from '@typed/context'
import { addEventListener } from '@typed/dom'
import * as Fx from '@typed/fx'

import { EventHandler } from '../EventHandler.js'
import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'

export class EventPart extends BasePart<EventHandler<any, any, any> | null> {
  readonly _tag = 'Event' as const

  constructor(
    readonly addEventListener: (
      handler: EventHandler<any, any, any>,
    ) => Effect.Effect<never, never, void>,
    readonly removeEventListener: Effect.Effect<never, never, void>,
    readonly name: string,
    index: number,
    value: EventHandler<any, any, any> | null = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): EventHandler<any, any, any> | null {
    if (value == null) return null
    if (Effect.isEffect(value)) return EventHandler(() => value)
    if (isEventHandler(value)) return value

    return null
  }

  protected setValue(value: EventHandler<any, any, any> | null) {
    return value ? this.addEventListener(value) : this.removeEventListener
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.update(placeholder), {
      onFailure: sink.error,
      onSuccess: sink.event,
    })
  }

  static fromHTMLElement(
    element: HTMLElement,
    name: string,
    index: number,
    onCause: (error: Cause.Cause<any>) => Effect.Effect<never, never, void>,
    context: Context<any>,
  ): EventPart {
    let fiber: Fiber.Fiber<never, void> | undefined

    const add = (handler: EventHandler<any, any, any>): Effect.Effect<never, never, void> =>
      pipe(
        remove,
        Effect.flatMap(() =>
          Effect.forkScoped(
            Fx.observe(addEventListener(name, handler.options)(element), (event) =>
              Effect.catchAllCause(handler.handler(event), onCause),
            ),
          ),
        ),
        Effect.flatMap((f: Fiber.Fiber<never, void>) =>
          Effect.sync(() => {
            fiber = f
          }),
        ),
        Effect.provideContext(context),
      )

    const remove = Effect.suspend(() => {
      if (fiber) {
        return Fiber.interruptFork(fiber)
      }

      return Effect.unit
    })

    const part = new EventPart(add, remove, name, index)

    return part
  }
}

function isEventHandler(value: unknown): value is EventHandler<any, any, any> {
  return !!value && typeof value === 'object' && 'handler' in value && 'options' in value
}
