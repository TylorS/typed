import type { Cause } from "./Cause.js"
import * as Effect from "./Effect.js"
import type * as Exit from "./Exit.js"
import type * as Fail from "./Fail.js"
import { type Scope } from "./Scope.js"

export class Async<I extends AsyncCommand = AsyncCommand> extends Effect.service<Async.HKT, AsyncCommand>("Async")<I> {}

export type AsyncCommand = Async.CallbackCommand<any, any> | Async.ForkCommand<any, any>

export namespace Async {
  export interface CallbackCommand<E, A> {
    readonly _tag: "Callback"
    readonly i0: Async.Callback<E, A>
  }
  export interface ForkCommand<R, A> {
    readonly _tag: "Fork"
    readonly i0: Effect.Effect<R, A>
  }

  export interface HKT extends Effect.HKT {
    readonly contextType: this["input"] extends CallbackCommand<infer E, infer _> ? Fail.Fail<E> :
      this["input"] extends ForkCommand<infer R, infer _> ? R
      : never

    readonly outputType: this["input"] extends CallbackCommand<infer _, infer A> ? A :
      this["input"] extends ForkCommand<infer R, infer A> ? Process<Fail.Fail.Error<R>, A>
      : never
  }

  export type Callback<E, A> = (resume: Resume<E, A>) => Disposable | AsyncDisposable

  export type Resume<E, A> = {
    readonly done: (exit: Exit.Exit<E, A>) => void
    readonly fail: (e: E) => void
    readonly failCause: (e: Cause<E>) => void
    readonly unexpected: (u: unknown) => void
    readonly succeed: (a: A) => void
  }
}

export const async = <E, A>(
  f: Async.Callback<E, A>
): Effect.Effect<Async | ([E] extends [never] ? never : Fail.Fail<E>), A> => Async.make({ _tag: "Callback", i0: f })

export const fork = <R, A>(
  effect: Effect.Effect<R, A>
): Effect.Effect<Fail.Fail.ExcludeAll<R> | Scope | Async, Process<Fail.Fail.Error<R>, A>> =>
  Async.make({ _tag: "Fork", i0: effect })

export interface Process<E, A> extends PromiseLike<Exit.Exit<E, A>>, AsyncDisposable {}
