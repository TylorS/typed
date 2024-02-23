/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { type DomServices, domServices, type DomServicesElementParams } from "@typed/dom/DomServices"
import { GlobalThis } from "@typed/dom/GlobalThis"
import { Window } from "@typed/dom/Window"
import type { Environment } from "@typed/environment"
import { CurrentEnvironment } from "@typed/environment"
import * as Idle from "@typed/fx/Idle"
import type { Rendered } from "@typed/wire"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Scope from "effect/Scope"
import type { Entry } from "./Entry.js"

// TODO: We should probably have a more explicit environment type between DOM/HTML rendering

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export interface RenderContext {
  /**
   * The current environment we are rendering within
   */
  readonly environment: Environment

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
  "./RenderContext.js"
)

/**
 * @since 1.0.0
 */
export interface RenderQueue {
  readonly add: (part: unknown, task: () => void) => Effect.Effect<void, never, Scope.Scope>
}

/**
 * @since 1.0.0
 */
export type RenderContextOptions = IdleRequestOptions & {
  readonly environment: Environment
  readonly scope: Scope.Scope
}

/**
 * @since 1.0.0
 */
export function make({ ...options }: Omit<RenderContextOptions, "scope">, skipRenderScheduling?: boolean) {
  return Effect.scopeWith((scope) => Effect.succeed(unsafeMake({ ...options, scope }, skipRenderScheduling)))
}

/**
 * @since 1.0.0
 */
export function unsafeMake({
  environment,
  scope,
  ...options
}: RenderContextOptions, skipRenderScheduling?: boolean): RenderContext {
  return {
    environment,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
    queue: new RenderQueueImpl(scope, options, skipRenderScheduling ?? false)
  }
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

const buildWithCurrentEnvironment = (environment: Environment, skipRenderScheduling?: boolean) =>
  Layer.mergeAll(
    RenderContext.scoped(make({ environment }, skipRenderScheduling)),
    CurrentEnvironment.layer(environment)
  )

/**
 * @since 1.0.0
 */
export const dom: (
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
) => Layer.Layer<RenderContext | CurrentEnvironment | DomServices> = (window, options) =>
  Layer.provideMerge(
    Layer.mergeAll(
      buildWithCurrentEnvironment(
        "dom",
        options?.skipRenderScheduling
      ),
      domServices(options)
    ),
    Layer.mergeAll(Window.layer(window), GlobalThis.layer(window))
  )

/**
 * @since 1.0.0
 */
export const server: Layer.Layer<RenderContext | CurrentEnvironment> = buildWithCurrentEnvironment(
  "server"
)

const static_: Layer.Layer<RenderContext | CurrentEnvironment> = buildWithCurrentEnvironment("static")

export {
  /**
   * @since 1.0.0
   */
  static_ as static
}

class RenderQueueImpl implements RenderQueue {
  queue = new Map<unknown, () => void>()
  scheduled = false
  run: Effect.Effect<void, never, Scope.Scope>

  constructor(
    readonly scope: Scope.Scope,
    readonly options?: IdleRequestOptions,
    readonly skipRenderScheduling: boolean = false
  ) {
    this.add.bind(this)

    this.run = typeof requestAnimationFrame === "undefined" ? this.runIdle : this.runAnimationFrame
  }

  add(part: unknown, task: () => void) {
    if (this.skipRenderScheduling) return Effect.sync(task)

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

    return this.run.pipe(
      Scope.extend(this.scope),
      Effect.forkIn(this.scope)
    )
  })

  runIdle: Effect.Effect<void, never, Scope.Scope> = Effect.suspend(() => {
    return Effect.flatMap(
      Idle.whenIdle(this.options),
      (deadline) =>
        Effect.suspend(() => {
          const iterator = this.queue.entries()

          while (Idle.shouldContinue(deadline) && this.runTask(iterator)) {
            // Continue
          }

          // If we have more work to do, schedule another run
          if (this.queue.size > 0) {
            return this.runIdle
          }

          this.scheduled = false

          return Effect.unit
        })
    )
  })

  runAnimationFrame: Effect.Effect<void, never, Scope.Scope> = Effect.zipRight(
    Effect.async<void>((cb) => {
      const id = requestAnimationFrame(() => cb(Effect.unit))
      return Effect.sync(() => cancelAnimationFrame(id))
    }),
    Effect.sync(() => {
      const iterator = this.queue.entries()

      while (this.runTask(iterator)) {
        // Continue
      }

      this.scheduled = false
    })
  )

  private runTask = (iterator: Iterator<[unknown, () => void]>) => {
    const result = iterator.next()

    if (result.done) return false
    else {
      const [part, task] = result.value
      this.queue.delete(part)
      task()
      return true
    }
  }
}
