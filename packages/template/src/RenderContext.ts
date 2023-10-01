import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import { MulticastEffect } from "@typed/fx/internal/helpers"
import type { Entry } from "@typed/template/Entry"
import type { Part } from "@typed/template/Part"
import type { Rendered } from "@typed/wire"
import { Effect, Option } from "effect"
import type { Scope } from "effect/Scope"

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
  readonly add: (part: Part, effect: Effect.Effect<never, never, unknown>) => Effect.Effect<Scope, never, void>
}

export type RenderContextOptions = IdleRequestOptions & {
  readonly environment: RenderContext["environment"]
  readonly isBot?: RenderContext["isBot"]
}

export function make({
  environment,
  isBot = false,
  ...options
}: RenderContextOptions): RenderContext {
  return {
    environment,
    isBot,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
    queue: new RenderQueueImpl(options)
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

class RenderQueueImpl implements RenderQueue {
  #queue = new Map<Part, Effect.Effect<never, never, unknown>>()
  #iterator = this.#queue.entries()[Symbol.iterator]()

  constructor(readonly options?: IdleRequestOptions) {}

  add = (part: Part, effect: Effect.Effect<never, never, unknown>) =>
    Effect.acquireUseRelease(
      Effect.sync(() => this.#queue.set(part, effect)),
      () => this.#scheduleNextRun,
      () => Effect.sync(() => this.#queue.delete(part))
    )

  #scheduleNextRun = Effect.suspend(() => this.#queue.size === 0 ? Effect.unit : this.#run)

  #run: Effect.Effect<Scope, never, void> = new MulticastEffect(
    Effect.flatMap(Idle.whenIdle(this.options), (deadline) =>
      Effect.whileLoop({
        while: () => Idle.shouldContinue(deadline),
        step: () => Effect.unit,
        body: () => this.#runNext
      }))
  )

  #runNext = Effect.suspend(() => {
    const next = this.#iterator.next()

    if (next.done) return Effect.unit

    const [part, effect] = next.value

    this.#queue.delete(part)

    return effect
  })
}
