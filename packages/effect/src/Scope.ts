import * as Effect from "./Effect.js"

export class Scope extends Effect.service<Scope.HKT, ScopeCommand>("Scope") {}

export type ScopeCommand<R = any, A = any> = Scope.Add | Scope.Extend<R, A> | Scope.IsInterruptible

export namespace Scope {
  export interface Add {
    readonly _tag: "Add"
    readonly i0: Disposable | AsyncDisposable
  }

  export interface Extend<R, A> {
    readonly _tag: "Extend"
    readonly i0: Effect.Effect<R, A>
    readonly interruptible?: boolean | undefined
  }

  export interface IsInterruptible {
    readonly _tag: "IsInterruptible"
  }

  export interface HKT extends Effect.HKT {
    readonly contextType: this["input"] extends Scope.Extend<infer R, infer _> ? R | Scope : Scope

    readonly outputType: this["input"] extends Scope.Extend<infer _, infer A> ? A :
      this["input"] extends Scope.Add ? Disposable :
      this["input"] extends Scope.IsInterruptible ? boolean
      : never
  }
}

export function add(disposable: Disposable | AsyncDisposable): Effect.Effect<Scope, Disposable> {
  return Scope.make({ _tag: "Add", i0: disposable })
}

export function extend<R, A>(
  effect: Effect.Effect<R, A>,
  interruptible?: boolean
): Effect.Effect<R | Scope, A> {
  return Scope.make({ _tag: "Extend", i0: effect, interruptible })
}

export function interruptible<R, A>(effect: Effect.Effect<R, A>): Effect.Effect<R | Scope, A> {
  return extend(effect, true)
}

export function uninterruptible<R, A>(effect: Effect.Effect<R, A>): Effect.Effect<R | Scope, A> {
  return extend(effect, false)
}

export const isInterruptible: Effect.Effect<Scope, boolean> = Scope.make({ _tag: "IsInterruptible" })
