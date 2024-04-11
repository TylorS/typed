import { MapGenerator, OfGenerator, SingleShotGenerator } from "./internal/generators.js"
import { type Pipeable, pipeArguments } from "./Pipeable.js"

export interface Effect<R, A> extends Pipeable {
  readonly [Symbol.iterator]: () => Iterator<R, A, unknown>
}

export namespace Effect {
  export type Services<E> = E extends Effect<infer R, any> ? R : never
  export type Output<E> = E extends Effect<any, infer A> ? A : never

  export type Any = Effect<any, any>
}

export function gen<A, R = never>(f: () => Generator<R, A>): Effect<R, A> {
  return {
    [Symbol.iterator]: f,
    pipe() {
      return pipeArguments(this, arguments)
    }
  }
}

export function of<A>(a: A): Effect<never, A> {
  return new OfGenerator(a)
}

export function sync<A>(f: () => A): Effect<never, A> {
  return gen(() => new OfGenerator(f()))
}

export function service<T, X = unknown>(kind: string) {
  return class Service<I extends X = X> implements Pipeable {
    readonly ___HKT___!: never

    static readonly kind = kind
    readonly kind = kind

    constructor(readonly input: I) {}

    static make<T extends new<I extends X>(input: I) => any, const I extends X>(
      this: T,
      input: I
    ): InstanceType<T> {
      return new this<I>(input)
    }

    readonly [Symbol.iterator] = (): Generator<this | HKT.Context<T, this["input"]>, HKT.Output<T, this["input"]>> =>
      new SingleShotGenerator<this, HKT.Output<T, I>>(this)

    pipe() {
      return pipeArguments(this, arguments)
    }
  }
}

export interface AnyService {
  readonly kind: string
  new(input: any): any
}

export interface HKT {
  readonly ___HKT___: never
  readonly contextType: unknown
  readonly outputType: unknown
  readonly errorType: unknown
  readonly input?: unknown
}

export namespace HKT {
  export type Output<Type, Input> = Type extends HKT ? (Type & { readonly input: Input })["outputType"] : Type

  export type Context<Type, Input> = Type extends HKT ? (Type & { readonly input: Input })["contextType"] : never
}

export type Step<A, R, S> = Resume<A, S> | Return<R> | Unhandled
export type Resume<A, S> = { readonly step: "resume"; readonly value: A; readonly state: S }
export type Return<A> = { readonly step: "return"; readonly value: A }
export type Unhandled = { readonly step: "unhandled" }

export const resumeWith = <const A, const S>(a: A, s: S): Step<A, never, S> => ({ step: "resume", value: a, state: s })
export const resume = <const A>(a: A): Step<A, never, void> => resumeWith(a, undefined)
export const done = <const A>(a: A): Step<never, A, never> => ({ step: "return", value: a })
export const unhandled: Step<never, never, never> = { step: "unhandled" }

export function isService<R, S extends AnyService>(
  r: R,
  service: S
): r is InstanceType<S> {
  return !!r && typeof r === "object" && (r as any).kind === service.kind
}

export function handle<
  const E1,
  const R1,
  const E extends AnyService,
  const SE,
  const FE,
  const S,
  const A,
  const E2,
  const R2,
  const R
>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    initially: Effect<SE, S>
    handle: (e: InstanceType<E>, s: S) => Effect<E2, Step<A, R2, S>>
    return: (r: NoInfer<R1 | R2>, s: NoInfer<S>) => R
    finally: (s: NoInfer<S>) => Effect<FE, void>
  }
): Effect<SE | Exclude<E1, InstanceType<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends AnyService, const FE, const A, const E2, const R2, const R>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    handle: (e: InstanceType<E>) => Effect<E2, Step<A, R2, void>>
    return: (r: NoInfer<R1 | R2>) => R
    finally: () => Effect<FE, void>
  }
): Effect<Exclude<E1, InstanceType<E>> | E2 | FE, R>
export function handle<
  const E1,
  const R1,
  const E extends AnyService,
  const SE,
  const FE,
  const S,
  const A,
  const E2,
  const R2
>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    initially: Effect<SE, S>
    handle: (e: InstanceType<E>, s: NoInfer<S>) => Effect<E2, Step<A, R2, S>>
    finally: (s: NoInfer<S>) => Effect<FE, void>
  }
): Effect<SE | Exclude<E1, InstanceType<E>> | E2 | FE, R1 | R2>
export function handle<
  const E1,
  const R1,
  const E extends AnyService,
  const SE,
  const S,
  const A,
  const E2,
  const R2,
  const R
>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    initially: Effect<SE, S>
    handle: (e: InstanceType<E>, s: NoInfer<S>) => Effect<E2, Step<A, R2, S>>
    return: (r: NoInfer<R1 | R2>, s: NoInfer<S>) => R
  }
): Effect<SE | Exclude<E1, InstanceType<E>> | E2, R>
export function handle<const E1, const R1, const E extends AnyService, const A, const E2, const R2, const R>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    handle: (e: InstanceType<E>) => Effect<E2, Step<A, R2, void>>
    return: (r: NoInfer<R1 | R2>) => R
  }
): Effect<Exclude<E1, InstanceType<E>> | E2, R>
export function handle<const E1, const R1, const SE, const E extends AnyService, const S, const A, const E2, const R2>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    initially: Effect<SE, S>
    handle: (e: InstanceType<E>, s: NoInfer<S>) => Effect<E2, Step<A, R2, S>>
  }
): Effect<SE | Exclude<E1, InstanceType<E>> | E2, R1 | R2>
export function handle<const E1, const R1, const E extends AnyService, const FE, const A, const E2, const R2>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    handle: (e: InstanceType<E>) => Effect<E2, Step<A, R2, void>>
    finally: () => Effect<FE, void>
  }
): Effect<Exclude<E1, InstanceType<E>> | E2 | FE, R1 | R2>
export function handle<const E1, const R1, const E extends AnyService, const A, const E2, const R2>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    handle: (e: InstanceType<E>) => Effect<E2, Step<A, R2, void>>
  }
): Effect<Exclude<E1, InstanceType<E>> | E2, R1 | R2>
export function handle<
  const E1,
  const R1,
  const E extends AnyService,
  const SE,
  const FE,
  const S,
  const A,
  const E2,
  const R2,
  const R
>(
  effect: Effect<E1, R1>,
  match: E,
  handler: {
    initially?: Effect<SE, S>
    handle: (e: InstanceType<E>, s: S) => Effect<E2, Step<A, R2, S>>
    return?: (r: R1 | R2, s: S) => R
    finally?: (s: S) => Effect<FE, void>
  }
): Effect<SE | Exclude<E1, InstanceType<E>> | E2 | FE, R1 | R2 | R> {
  return gen(function*() {
    const iterator = effect[Symbol.iterator]()
    let state: any
    try {
      state = handler.initially ? (yield* handler.initially) : undefined
      let result = iterator.next()

      while (!result.done) {
        if (isService(result.value, match)) {
          const step: Step<A, R1 | R2, S> = yield* handler.handle(result.value, state)
          if (step.step === "return") return handler.return ? handler.return(step.value, state) : step.value
          else if (step.step === "unhandled") {
            result = iterator.next(result.value)
          } else {
            state = step.state
            result = iterator.next(step.value)
          }
        } else result = iterator.next(yield result.value as Exclude<E1, InstanceType<E>>)
      }

      return handler.return ? handler.return(result.value, state) : result.value
    } finally {
      if (iterator.return) iterator.return()
      if (handler.finally) yield* handler.finally(state)
    }
  })
}

export function map<R, A, B>(effect: Effect<R, A>, f: (a: A) => B): Effect<R, B> {
  return gen(() => new MapGenerator(effect[Symbol.iterator](), f))
}
