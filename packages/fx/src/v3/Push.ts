import type { Effect, Option, Pipeable, Scope } from "effect"
import type { Cause } from "effect/Cause"
import { dual } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import type { Fx } from "./Fx"
import * as core from "./internal/core"
import { FxBase } from "./internal/protos"
import * as Sink from "./Sink"

export interface Push<R, E, A, R2, E2, B> extends Sink.Sink<R, E, A>, Fx<R2, E2, B>, Pipeable.Pipeable {}

export namespace Push {
  export interface Any extends Push<any, any, any, any, any, any> {}
}

export const make: {
  <R2, E2, B>(fx: Fx<R2, E2, B>): <R, E, A>(sink: Sink.Sink<R, E, A>) => Push<R, E, A, R2, E2, B>
  <R, E, A, R2, E2, B>(sink: Sink.Sink<R, E, A>, fx: Fx<R2, E2, B>): Push<R, E, A, R2, E2, B>
} = dual(2, function make<R, E, A, R2, E2, B>(
  sink: Sink.Sink<R, E, A>,
  fx: Fx<R2, E2, B>
): Push<R, E, A, R2, E2, B> {
  return new PushImpl(sink, fx)
})

class PushImpl<R, E, A, R2, E2, B> extends FxBase<R2, E2, B> implements Push<R, E, A, R2, E2, B> {
  constructor(readonly sink: Sink.Sink<R, E, A>, readonly fx: Fx<R2, E2, B>) {
    super()

    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R3>(sink: Sink.Sink<R3, E2, B>): Effect.Effect<R2 | R3, never, unknown> {
    return this.fx.run(sink)
  }

  onFailure(cause: Cause<E>): Effect.Effect<R, never, unknown> {
    return this.sink.onFailure(cause)
  }

  onSuccess(value: A): Effect.Effect<R, never, unknown> {
    return this.sink.onSuccess(value)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export const mapInput: {
  <P extends Push.Any, C>(
    f: (c: C) => Sink.Success<P>
  ): (
    push: P
  ) => Push<Sink.Context<P>, Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>

  <P extends Push.Any, C>(
    push: P,
    f: (c: C) => Sink.Sink.Success<P>
  ): Push<Sink.Sink.Context<P>, Sink.Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
} = dual(2, function mapInput<P extends Push.Any, C>(
  push: P,
  f: (c: C) => Sink.Success<P>
): Push<Sink.Context<P>, Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>> {
  return make(
    Sink.map(push, f),
    push
  )
})

export const mapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<R3, E, A>
  ): <R, R2, E2, B>(push: Push<R, E, A, R2, E2, B>) => Push<R | R3, E, C, R2, E2, B>

  <R, E, A, R2, E2, B, R3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (c: C) => Effect.Effect<R3, E, A>
  ): Push<R | R3, E, C, R2, E2, B>
} = dual(2, function mapInputEffect<R, E, A, R2, E2, B, R3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (c: C) => Effect.Effect<R3, E, A>
): Push<R | R3, E, C, R2, E2, B> {
  return make(
    Sink.mapEffect(push, f),
    push
  )
})

export const filterInput: {
  <A>(f: (a: A) => boolean): <P extends Push.Any>(
    push: P
  ) => Push<Sink.Context<P>, Sink.Error<P>, A, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <R, E, A, R2, E2, B>(push: Push<R, E, A, R2, E2, B>, f: (a: A) => boolean): Push<R, E, A, R2, E2, B>
} = dual(2, function filterInput<R, E, A, R2, E2, B>(
  push: Push<R, E, A, R2, E2, B>,
  f: (a: A) => boolean
): Push<R, E, A, R2, E2, B> {
  return make(
    Sink.filter(push, f),
    push
  )
})

export const filterInputEffect: {
  <A, R3, E>(f: (a: A) => Effect.Effect<R3, E, boolean>): <R, R2, E2, B>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R | R3, E, A, R2, E2, B>

  <R, E, A, R2, E2, B, R3>(
    push: Push<R, E, A, R2, E2, B>,
    f: (a: A) => Effect.Effect<R3, E, boolean>
  ): Push<R | R3, E, A, R2, E2, B>
} = dual(2, function filterInputEffect<R, E, A, R2, E2, B, R3>(
  push: Push<R, E, A, R2, E2, B>,
  f: (a: A) => Effect.Effect<R3, E, boolean>
): Push<R | R3, E, A, R2, E2, B> {
  return make(
    Sink.filterEffect<R | R3, E, A>(push, f),
    push
  )
})

export const filterMapInput: {
  <C, A>(f: (c: C) => Option.Option<A>): <P extends Push.Any>(
    push: P
  ) => Push<Sink.Context<P>, Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (c: C) => Option.Option<A>): Push<R, E, C, R2, E2, B>
} = dual(2, function filterMapInput<R, E, A, R2, E2, B, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (c: C) => Option.Option<A>
): Push<R, E, C, R2, E2, B> {
  return make(
    Sink.filterMap(push, f),
    push
  )
})

export const filterMapInputEffect: {
  <C, R3, E, A>(f: (c: C) => Effect.Effect<R3, E, Option.Option<A>>): <R, R2, E2, B>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R | R3, E, C, R2, E2, B>
  <R, E, A, R2, E2, B, R3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (c: C) => Effect.Effect<R3, E, Option.Option<A>>
  ): Push<R | R3, E, C, R2, E2, B>
} = dual(2, function filterMapInputEffect<R, E, A, R2, E2, B, R3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (c: C) => Effect.Effect<R3, E, Option.Option<A>>
): Push<R | R3, E, C, R2, E2, B> {
  return make(
    Sink.filterMapEffect(push, f),
    push
  )
})

export const map: {
  <B, C>(f: (b: B) => C): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R2, E2, C>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => C): Push<R, E, A, R2, E2, C>
} = dual(2, function map<R, E, A, R2, E2, B, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => C
): Push<R, E, A, R2, E2, C> {
  return make(
    push,
    core.map(push, f)
  )
})

export const mapEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, C>
  ): Push<R, E, A, R2 | R3, E2 | E3, C>
} = dual(2, function mapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3, E2 | E3, C> {
  return make(
    push,
    core.mapEffect(push, f)
  )
})

export const filter: {
  <B>(f: (b: B) => boolean): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R2, E2, B>
  <R, E, A, R2, E2, B>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => boolean): Push<R, E, A, R2, E2, B>
} = dual(2, function filter<R, E, A, R2, E2, B>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => boolean
): Push<R, E, A, R2, E2, B> {
  return make(
    push,
    core.filter(push, f)
  )
})

export const filterEffect: {
  <B, R3, E3>(f: (b: B) => Effect.Effect<R3, E3, boolean>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3, E2 | E3, B>
  <R, E, A, R2, E2, B, R3, E3>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, boolean>
  ): Push<R, E, A, R2 | R3, E2 | E3, B>
} = dual(2, function filterEffect<R, E, A, R2, E2, B, R3, E3>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, boolean>
): Push<R, E, A, R2 | R3, E2 | E3, B> {
  return make(
    push,
    core.filterEffect(push, f)
  )
})

export const filterMap: {
  <B, C>(f: (b: B) => Option.Option<C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2, E2, C>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => Option.Option<C>): Push<R, E, A, R2, E2, C>
} = dual(2, function filterMap<R, E, A, R2, E2, B, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Option.Option<C>
): Push<R, E, A, R2, E2, C> {
  return make(
    push,
    core.filterMap(push, f)
  )
})

export const filterMapEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, Option.Option<C>>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, Option.Option<C>>
  ): Push<R, E, A, R2 | R3, E2 | E3, C>
} = dual(2, function filterMapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, Option.Option<C>>
): Push<R, E, A, R2 | R3, E2 | E3, C> {
  return make(
    push,
    core.filterMapEffect(push, f)
  )
})

export const switchMap: {
  <B, R3, E3, C>(f: (b: B) => Fx<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
} = dual(2, function switchMap<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Fx<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.switchMap(push, f)
  )
})

export const switchMapEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
} = dual(2, function switchMapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.switchMapEffect(push, f)
  )
})

export const flatMap: {
  <B, R3, E3, C>(f: (b: B) => Fx<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
} = dual(2, function flatMap<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Fx<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.flatMap(push, f)
  )
})

export const flatMapEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
} = dual(2, function flatMapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.flatMapEffect(push, f)
  )
})

export const exhaustMap: {
  <B, R3, E3, C>(f: (b: B) => Fx<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
} = dual(2, function exhaustMap<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Fx<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.exhaustMap(push, f)
  )
})

export const exhaustMapEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
} = dual(2, function exhaustMapEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.exhaustMapEffect(push, f)
  )
})

export const exhaustMapLatest: {
  <B, R3, E3, C>(f: (b: B) => Fx<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
} = dual(2, function exhaustMapLatest<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Fx<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.exhaustMapLatest(push, f)
  )
})

export const exhaustMapLatestEffect: {
  <B, R3, E3, C>(f: (b: B) => Effect.Effect<R3, E3, C>): <R, E, A, R2, E2>(
    push: Push<R, E, A, R2, E2, B>
  ) => Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
} = dual(2, function exhaustMapLatestEffect<R, E, A, R2, E2, B, R3, E3, C>(
  push: Push<R, E, A, R2, E2, B>,
  f: (b: B) => Effect.Effect<R3, E3, C>
): Push<R, E, A, R2 | R3 | Scope.Scope, E2 | E3, C> {
  return make(
    push,
    core.exhaustMapLatestEffect(push, f)
  )
})