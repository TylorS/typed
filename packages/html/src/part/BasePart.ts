import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'

export abstract class BasePart<R, E> {
  abstract readonly _tag: string

  protected _hasBeenUpdated = false
  protected _subscribers = new Set<Effect.Effect<never, never, unknown>>()

  constructor(readonly document: Document, public value: unknown = undefined) {}

  /**
   * @internal
   */
  abstract handle(value: unknown): Effect.Effect<R, E, unknown>

  /**
   * @internal
   */
  getValue(value: unknown): unknown {
    return value
  }

  /**
   * @internal
   */
  abstract getHTML(template: string): string

  /**
   * Update the value of this part.
   */
  readonly update = (newValue: unknown): Effect.Effect<R, E, unknown> => {
    this._hasBeenUpdated = true

    const value = this.getValue(newValue)

    if (value === this.value) return Effect.unit()

    if (this._subscribers.size > 0) {
      return Effect.ensuring(
        this.handle(value),
        Effect.suspend(() => {
          this.value = value

          return this.emit()
        }),
      )
    }

    return Effect.tap(this.handle(value), () => Effect.sync(() => (this.value = value)))
  }

  /**
   * @internal
   */
  subscribe = <R>(
    f: (part: this) => Effect.Effect<R, never, unknown>,
  ): Effect.Effect<R | Scope.Scope, never, unknown> => {
    const { _subscribers } = this
    const subscriber = f(this)

    return Effect.gen(function* ($) {
      const context = yield* $(Effect.context<R>())
      const subscriber_ = Effect.provideContext(subscriber, context)

      _subscribers.add(subscriber_)

      yield* $(Effect.addFinalizer(() => Effect.sync(() => _subscribers.delete(subscriber_))))
    })
  }

  protected emit() {
    const { _subscribers } = this

    return Effect.all(_subscribers)
  }

  get hasBeenUpdated() {
    return this._hasBeenUpdated
  }
}
