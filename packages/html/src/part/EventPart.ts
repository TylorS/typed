import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { addEventListener } from '@typed/dom'
import { observe } from '@typed/fx'

import { EventHandlerImplementation } from '../EventHandler.js'

import { BasePart } from './BasePart.js'
import { removeAttribute } from './templateHelpers.js'

export class EventPart<R = never, E = never> extends BasePart<R | Scope.Scope, E> {
  readonly _tag = 'Event'

  constructor(document: Document, readonly element: HTMLElement, readonly eventName: string) {
    super(document)
  }

  /**
   * @internal
   */
  handle(value: unknown) {
    const [handler, options] = getEventHandlerAndOptions<R, E>(value)

    if (!handler) return Effect.unit()

    const { element, eventName } = this

    return pipe(
      element,
      addEventListener(eventName, options),
      observe(handler),
      Effect.forkScoped,
      Effect.asUnit,
    )
  }

  /**
   * @internal
   */
  getHTML(template: string): string {
    return removeAttribute('on' + this.eventName, removeAttribute('@' + this.eventName, template))
  }
}

function getEventHandlerAndOptions<R, E>(
  value: unknown,
): readonly [
  undefined | ((event: any) => Effect.Effect<R, E, void>),
  boolean | AddEventListenerOptions | undefined,
] {
  if (value instanceof EventHandlerImplementation) {
    return [value.handler, value.options]
  }

  if (Effect.isEffect(value)) {
    return [() => value, undefined] as any
  }

  if (!value) {
    return [undefined, undefined] as const
  }

  throw new Error(`Unexpected value for event handler: ${JSON.stringify(value)}`)
}
