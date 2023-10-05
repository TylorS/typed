import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import type { Entry } from "@typed/template/Entry"
import type { Part } from "@typed/template/Part"
import type { Rendered } from "@typed/wire"
import type { Layer } from "effect"
import { Effect, Fiber, Option } from "effect"
import * as Scope from "effect/Scope"

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

export const RenderContext: Context.Tagged<RenderContext, RenderContext> = Context.Tagged<RenderContext>(
  "@typed/template/RenderContext"
)

export interface RenderQueue {
  readonly add: (part: Part, task: () => void) => Effect.Effect<Scope.Scope, never, void>
}

export type RenderContextOptions = IdleRequestOptions & {
  readonly environment: RenderContext["environment"]
  readonly scope: Scope.Scope
  readonly isBot?: RenderContext["isBot"]
}

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

export type Environment = RenderContext["environment"]

export const Environment: { readonly [_ in Environment]: _ } = {
  server: "server",
  browser: "browser",
  static: "static"
}

export function getRenderCache<T>(renderCache: RenderContext["renderCache"], key: object): Option.Option<T> {
  return renderCache.has(key) ? Option.some(renderCache.get(key) as T) : Option.none()
}

export function getTemplateCache(
  templateCache: RenderContext["templateCache"],
  key: TemplateStringsArray
): Option.Option<Entry> {
  return Option.fromNullable(templateCache.get(key))
}

export const browser: Layer.Layer<never, never, RenderContext> = RenderContext.scoped(
  Effect.scopeWith((scope) =>
    Effect.succeed(make({
      environment: "browser",
      scope
    }))
  )
)

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

export { static_ as static }

class RenderQueueImpl implements RenderQueue {
  queue = new Map<Part, () => void>()
  scheduled = false

  constructor(readonly scope: Scope.Scope, readonly options?: IdleRequestOptions) {}

  add = (part: Part, task: () => void) =>
    Effect.suspend(() => {
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

  scheduleNextRun = Effect.suspend(() => {
    if (this.queue.size === 0 || this.scheduled) return Effect.unit

    this.scheduled = true

    return Scope.addFinalizer(this.scope, Fiber.interrupt(Effect.runFork(this.run)))
  })

  run: Effect.Effect<never, never, void> = Effect.provideService(
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
}
