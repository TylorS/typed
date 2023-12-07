import type { FiberId, Predicate, Scope } from "effect"
import { Cause, Effect, flow, Option } from "effect"
import type { TypeLambda } from "effect/HKT"
import { matchFusable } from "../Fusion"
import type { Fx } from "../Fx"
import * as Sink from "../Sink"
import { FusableFx } from "./protos"

const SuccessTypeId = Symbol.for("@typed/fx/internal/Success")
const FailCauseTypeId = Symbol.for("@typed/fx/internal/FailCause")
const NeverTypeId = Symbol.for("@typed/fx/internal/Never")
const EmptyTypeId = Symbol.for("@typed/fx/internal/Empty")
const SuspendTypeId = Symbol.for("@typed/fx/internal/Suspend")
const MapTypeId = Symbol.for("@typed/fx/internal/Map")
const FilterTypeId = Symbol.for("@typed/fx/internal/Filter")
const FilterMapTypeId = Symbol.for("@typed/fx/internal/FilterMap")
const SuspendedMapTypeId = Symbol.for("@typed/fx/internal/SuspendedMap")
const SuspendedFilterTypeId = Symbol.for("@typed/fx/internal/SuspendedFilter")
const SuspendedFilterMapTypeId = Symbol.for("@typed/fx/internal/SuspendedFilterMap")

const FILTER_MAP_FUSION_IDS = [
  SuccessTypeId,
  FailCauseTypeId,
  EmptyTypeId,
  NeverTypeId,
  MapTypeId,
  FilterTypeId,
  FilterMapTypeId,
  SuspendedMapTypeId,
  SuspendedFilterTypeId,
  SuspendedFilterMapTypeId
] as const

declare module "../Fusion.js" {
  export interface FusionMap {
    readonly [SuccessTypeId]: SuccessTypeLambda
    readonly [FailCauseTypeId]: FailCauseTypeLambda
    readonly [EmptyTypeId]: EmptyTypeLambda
    readonly [NeverTypeId]: NeverTypeLambda
    readonly [SuspendTypeId]: SuspendTypeLambda
    readonly [MapTypeId]: MapTypeLambda
    readonly [FilterTypeId]: FilterTypeLambda
    readonly [FilterMapTypeId]: FilterMapTypeLambda
    readonly [SuspendedMapTypeId]: SuspendedMapTypeLambda
    readonly [SuspendedFilterTypeId]: SuspendedFilterTypeLambda
    readonly [SuspendedFilterMapTypeId]: SuspendedFilterMapTypeLambda
  }
}

interface SuccessTypeLambda extends TypeLambda {
  readonly type: Success<this["Target"]>
}

class Success<A> extends FusableFx<never, never, A> {
  constructor(readonly value: A) {
    super(SuccessTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, never, A>) {
    return sink.onSuccess(this.value)
  }
}

export const succeed = <A>(value: A): Fx<never, never, A> => new Success(value)

interface FailCauseTypeLambda extends TypeLambda {
  readonly type: FailCause<this["Out1"]>
}

class FailCause<E> extends FusableFx<never, E, never> {
  constructor(readonly cause: Cause.Cause<E>) {
    super(FailCauseTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, E, never>) {
    return sink.onFailure(this.cause)
  }
}

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new FailCause(cause)

export const fail = <E>(error: E): Fx<never, E, never> => failCause(Cause.fail(error))

export const die = (error: unknown): Fx<never, never, never> => failCause(Cause.die(error))

export const interrupt = (id: FiberId.FiberId): Fx<never, never, never> => failCause(Cause.interrupt(id))

interface NeverTypeLambda extends TypeLambda {
  readonly type: Fx<never, never, never>
}

export const never: Fx<never, never, never> = new (class Never extends FusableFx<never, never, never> {
  constructor() {
    super(NeverTypeId)
  }

  run() {
    return Effect.never
  }
})()

interface EmptyTypeLambda extends TypeLambda {
  readonly type: Fx<never, never, never>
}

export const empty: Fx<never, never, never> = new (class Empty extends FusableFx<never, never, never> {
  constructor() {
    super(EmptyTypeId)
  }

  run() {
    return Effect.unit
  }
})()

interface SuspendTypeLambda extends TypeLambda {
  readonly type: Suspend<this["Out2"], this["Out1"], this["Target"]>
}

class Suspend<R, E, A> extends FusableFx<R, E, A> {
  constructor(readonly f: () => Fx<R, E, A>) {
    super(SuspendTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, E, A>, scope: Scope.Scope) {
    return this.f().run(sink, scope)
  }
}

export const suspend = <R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> => new Suspend(f)

interface MapTypeLambda extends TypeLambda {
  readonly type: Map<this["Out2"], this["Out1"], any, this["Target"]>
}

class Map<R, E, A, B> extends FusableFx<R, E, B> {
  constructor(readonly source: Fx<R, E, A>, readonly f: (a: A) => B) {
    super(MapTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, E, B>, scope: Scope.Scope) {
    const { f } = this

    return this.source.run(Sink.map(sink, f), scope)
  }

  static make<R, E, A, B>(
    source: Fx<R, E, A>,
    f: (a: A) => B
  ): Fx<R, E, B> {
    return matchFusable(source, FILTER_MAP_FUSION_IDS, {
      [SuccessTypeId]: (success) => new SuspendedMap(success.value, f),
      [FailCauseTypeId]: (failCause) => failCause,
      [EmptyTypeId]: (empty) => empty,
      [NeverTypeId]: (never) => never,
      [MapTypeId]: (map) => new Map(map.source, flow(map.f, f)),
      [FilterTypeId]: (filter) =>
        new FilterMap(filter.source, (a) => filter.predicate(a) ? Option.some(f(a)) : Option.none()),
      [FilterMapTypeId]: (filterMap) => new FilterMap(filterMap.source, (a) => Option.map(filterMap.predicate(a), f)),
      [SuspendedMapTypeId]: (s) => new SuspendedMap(s.value, flow(s.f, f)),
      [SuspendedFilterTypeId]: (s) =>
        new SuspendedFilterMap(s.value, (a) => s.predicate(a) ? Option.some(f(a)) : Option.none()),
      [SuspendedFilterMapTypeId]: (s) => new SuspendedFilterMap(s.value, (a) => Option.map(s.f(a), f)),
      _: () => new Map(source, f)
    })
  }
}

interface FilterTypeLambda extends TypeLambda {
  readonly type: Filter<this["Out2"], this["Out1"], this["Target"]>
}

class Filter<R, E, A> extends FusableFx<R, E, A> {
  constructor(readonly source: Fx<R, E, A>, readonly predicate: Predicate.Predicate<A>) {
    super(FilterTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, E, A>, scope: Scope.Scope) {
    return this.source.run(Sink.filter(sink, this.predicate), scope)
  }

  static make<R, E, A>(
    source: Fx<R, E, A>,
    predicate: Predicate.Predicate<A>
  ): Fx<R, E, A> {
    return matchFusable(source, FILTER_MAP_FUSION_IDS, {
      [SuccessTypeId]: (s) => new SuspendedFilter(s.value, predicate),
      [FailCauseTypeId]: (failCause) => failCause,
      [EmptyTypeId]: (empty) => empty,
      [NeverTypeId]: (never) => never,
      [MapTypeId]: (map) =>
        new FilterMap(map.source, (a) => {
          const b = map.f(a)
          return predicate(b) ? Option.some(b) : Option.none()
        }),
      [FilterTypeId]: (filter) => new Filter(filter.source, (a) => filter.predicate(a) && predicate(a)),
      [FilterMapTypeId]: (filterMap) =>
        new FilterMap(filterMap.source, (a) => Option.filter(filterMap.predicate(a), predicate)),
      [SuspendedMapTypeId]: (map) =>
        new SuspendedFilterMap(map.value, (a) => {
          const b = map.f(a)
          return predicate(b) ? Option.some(b) : Option.none()
        }),
      [SuspendedFilterTypeId]: (filter) =>
        new SuspendedFilter(filter.value, (a) => filter.predicate(a) && predicate(a)),
      [SuspendedFilterMapTypeId]: (filterMap) =>
        new SuspendedFilterMap(filterMap.value, (a) => Option.filter(filterMap.f(a), predicate)),
      _: () => new Filter(source, predicate)
    })
  }
}

interface FilterMapTypeLambda extends TypeLambda {
  readonly type: FilterMap<this["Out2"], this["Out1"], any, this["Target"]>
}

class FilterMap<R, E, A, B> extends FusableFx<R, E, B> {
  constructor(readonly source: Fx<R, E, A>, readonly predicate: (a: A) => Option.Option<B>) {
    super(FilterTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, E, B>, scope: Scope.Scope) {
    return this.source.run(Sink.filterMap(sink, this.predicate), scope)
  }

  static make<R, E, A, B>(
    source: Fx<R, E, A>,
    f: (a: A) => Option.Option<B>
  ): Fx<R, E, B> {
    return matchFusable(source, FILTER_MAP_FUSION_IDS, {
      [SuccessTypeId]: (s) => new SuspendedFilterMap(s.value, f),
      [FailCauseTypeId]: (failCause) => failCause,
      [EmptyTypeId]: (empty) => empty,
      [NeverTypeId]: (never) => never,
      [MapTypeId]: (map) => new FilterMap(map.source, flow(map.f, f)),
      [FilterTypeId]: (filter) => new FilterMap(filter.source, (a) => filter.predicate(a) ? f(a) : Option.none()),
      [FilterMapTypeId]: (filterMap) =>
        new FilterMap(filterMap.source, (a) => Option.flatMap(filterMap.predicate(a), f)),
      [SuspendedMapTypeId]: (map) => new SuspendedFilterMap(map.value, flow(map.f, f)),
      [SuspendedFilterTypeId]: (filter) =>
        new SuspendedFilterMap(filter.value, (a) => filter.predicate(a) ? f(a) : Option.none()),
      [SuspendedFilterMapTypeId]: (filterMap) =>
        new SuspendedFilterMap(filterMap.value, (a) => Option.flatMap(filterMap.f(a), f)),
      _: () => new FilterMap(source, f)
    })
  }
}

interface SuspendedMapTypeLambda extends TypeLambda {
  readonly type: SuspendedMap<any, this["Target"]>
}

class SuspendedMap<A, B> extends FusableFx<never, never, B> {
  constructor(readonly value: A, readonly f: (a: A) => B) {
    super(SuspendedMapTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, never, B>) {
    return Effect.suspend(() => sink.onSuccess(this.f(this.value)))
  }
}

interface SuspendedFilterTypeLambda extends TypeLambda {
  readonly type: SuspendedFilter<this["Target"]>
}

class SuspendedFilter<A> extends FusableFx<never, never, A> {
  constructor(readonly value: A, readonly predicate: Predicate.Predicate<A>) {
    super(SuspendedFilterTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, never, A>) {
    return Effect.suspend(() => {
      if (this.predicate(this.value)) {
        return sink.onSuccess(this.value)
      } else {
        return Effect.unit
      }
    })
  }
}

interface SuspendedFilterMapTypeLambda extends TypeLambda {
  readonly type: SuspendedFilterMap<any, this["Target"]>
}

class SuspendedFilterMap<A, B> extends FusableFx<never, never, B> {
  constructor(readonly value: A, readonly f: (a: A) => Option.Option<B>) {
    super(SuspendedFilterMapTypeId)
  }

  run<R2>(sink: Sink.Sink<R2, never, B>) {
    return Effect.suspend(() => {
      const option = this.f(this.value)
      if (Option.isSome(option)) return sink.onSuccess(option.value)
      else return Effect.unit
    })
  }
}
