/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import type { Entry } from "@typed/template/Entry"
import type { Part, SparsePart } from "@typed/template/Part"
import type { Rendered } from "@typed/wire"
import type { Layer } from "effect"
import { Effect, Fiber, Option } from "effect"
import * as Scope from "effect/Scope"

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export interface RenderContext {
  /**
   * The current environment.
   */
  readonly environment: "server" | "browser" | "static"

  /**
   * Whether or not the current render is for a bot.
   */
  readonly isBot: boolean

  /**
   * Cache for root Node's being rendered into.
   */
  readonly renderCache: WeakMap<object, Rendered | null>

  /**
   * Cache for individual templates.
   */
  readonly templateCache: WeakMap<TemplateStringsArray, Entry>

  /**
   * Queue for work to be batched
   */
  readonly queue: RenderQueue
}

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export const RenderContext: Context.Tagged<RenderContext, RenderContext> = Context.Tagged<RenderContext>(
  "@typed/template/RenderContext"
)

/**
 * @since 1.0.0
 */
export interface RenderQueue {
  readonly add: (part: Part | SparsePart, task: () => void) => Effect.Effect<Scope.Scope, never, void>
}

/**
 * @since 1.0.0
 */
export type RenderContextOptions = IdleRequestOptions & {
  readonly environment: RenderContext["environment"]
  readonly scope: Scope.Scope
  readonly isBot?: RenderContext["isBot"] | undefined
}

/**
 * @since 1.0.0
 */
export function make({
  environment,
  isBot = false,
  scope,
  ...options
}: RenderContextOptions): RenderContext {
  return {
    environment,
    isBot,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
    queue: new RenderQueueImpl(scope, options)
  }
}

/**
 * @since 1.0.0
 */
export type Environment = RenderContext["environment"]

/**
 * @since 1.0.0
 */
export const Environment: { readonly [_ in Environment]: _ } = {
  server: "server",
  browser: "browser",
  static: "static"
}

/**
 * @since 1.0.0
 */
export function getRenderCache<T>(renderCache: RenderContext["renderCache"], key: object): Option.Option<T> {
  return renderCache.has(key) ? Option.some(renderCache.get(key) as T) : Option.none()
}

/**
 * @since 1.0.0
 */
export function getTemplateCache(
  templateCache: RenderContext["templateCache"],
  key: TemplateStringsArray
): Option.Option<Entry> {
  return Option.fromNullable(templateCache.get(key))
}

/**
 * @since 1.0.0
 */
export const browser: Layer.Layer<never, never, RenderContext> = RenderContext.scoped(
  Effect.scopeWith((scope) =>
    Effect.succeed(make({
      environment: "browser",
      scope
    }))
  )
)

/**
 * @since 1.0.0
 */
export const server: (isBot?: boolean) => Layer.Layer<never, never, RenderContext> = (isBot) =>
  RenderContext.scoped(
    Effect.scopeWith((scope) =>
      Effect.succeed(make({
        environment: "server",
        isBot,
        scope
      }))
    )
  )

const static_: (isBot?: boolean) => Layer.Layer<never, never, RenderContext> = (isBot) =>
  RenderContext.scoped(
    Effect.scopeWith((scope) =>
      Effect.succeed(make({
        environment: "static",
        isBot,
        scope
      }))
    )
  )

export {
  /**
   * @since 1.0.0
   */
  static_ as static
}

class RenderQueueImpl implements RenderQueue {
  queue = new Map<Part | SparsePart, () => void>()
  scheduled = false

  constructor(readonly scope: Scope.Scope, readonly options?: IdleRequestOptions) {
    this.add.bind(this)
  }

  add(part: Part | SparsePart, task: () => void) {
    return Effect.suspend(() => {
      this.queue.set(part, task)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            const currentTask = this.queue.get(part)

            // If the current task is still the same we'll delete it from the queue
            if (currentTask === task) {
              this.queue.delete(part)
            }
          })
        ),
        this.scheduleNextRun
      )
    })
  }

  scheduleNextRun = Effect.suspend(() => {
    if (this.queue.size === 0 || this.scheduled) return Effect.unit

    this.scheduled = true

    return Scope.addFinalizer(this.scope, Fiber.interrupt(Effect.runFork(this.run)))
  })

  run: Effect.Effect<never, never, void> = Effect.suspend(() =>
    Effect.provideService(
      Effect.flatMap(
        Idle.whenIdle(this.options),
        (deadline) =>
          Effect.suspend(() => {
            const iterator = this.queue.entries()

            while (Idle.shouldContinue(deadline)) {
              const result = iterator.next()

              if (result.done) break
              else {
                const [part, task] = result.value
                this.queue.delete(part)
                task()
              }
            }

            if (this.queue.size > 0) {
              return this.run
            }

            this.scheduled = false

            return Effect.unit
          })
      ),
      Scope.Scope,
      this.scope
    )
  )
}
