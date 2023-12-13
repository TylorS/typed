import { Effect, Option } from "effect"
import * as Sink from "../Sink.js"
import * as EffectOp from "./effect-operator.js"
import type { SyncLoopOperator } from "./loop-operator.js"
import * as SyncOp from "./sync-operator.js"

export type EffectLoopOperator<B = any, A = any, R = any, E = any, C = any> =
  | LoopEffectOperator<B, A, R, E, C>
  | FilterMapLoopEffectOperator<B, A, R, E, C>

export interface LoopEffectOperator<B, A, R, E, C> {
  readonly _tag: "LoopEffect"
  readonly seed: B
  readonly f: (acc: B, a: A) => Effect.Effect<R, E, readonly [C, B]>
}

export function LoopEffectOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R, E, readonly [C, B]>
): LoopEffectOperator<B, A, R, E, C> {
  return { _tag: "LoopEffect", seed, f }
}

export interface FilterMapLoopEffectOperator<B, A, R, E, C> {
  readonly _tag: "FilterMapLoopEffect"
  readonly seed: B
  readonly f: (acc: B, a: A) => Effect.Effect<R, E, readonly [Option.Option<C>, B]>
}

export function FilterMapLoopEffectOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R, E, readonly [Option.Option<C>, B]>
): FilterMapLoopEffectOperator<B, A, R, E, C> {
  return { _tag: "FilterMapLoopEffect", seed, f }
}

export function compileLoopEffectOperatorSink<R>(operator: EffectLoopOperator, sink: Sink.Sink<R, any, any>) {
  switch (operator._tag) {
    case "LoopEffect":
      return Sink.loopEffect(sink, operator.seed, operator.f)
    case "FilterMapLoopEffect":
      return Sink.filterMapLoopEffect(sink, operator.seed, operator.f)
  }
}

export function fuseLoopEffectOperators(first: EffectLoopOperator, second: EffectLoopOperator): EffectLoopOperator {
  switch (first._tag) {
    case "LoopEffect": {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator(
            [first.seed, second.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                first.f(accA, accB),
                ([b, updatedA]) => Effect.map(second.f(accA, b), ([c, updatedB]) => [c, [updatedA, updatedB]] as const)
              )
          )
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(
            [first.seed, second.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                first.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(second.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([Option.some(c), [updatedA, updatedB]] as const)
                  })
              )
          )
      }
    }
    case "FilterMapLoopEffect": {
      switch (second._tag) {
        case "LoopEffect":
          return FilterMapLoopEffectOperator(
            [first.seed, second.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                first.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(second.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([Option.some(c), [updatedA, updatedB]] as const)
                  })
              )
          )
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(
            [first.seed, second.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                first.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(second.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([c, [updatedA, updatedB]] as const)
                  })
              )
          )
      }
    }
  }
}

export function fuseSyncLoopOperatorBefore(first: SyncLoopOperator, second: EffectLoopOperator): EffectLoopOperator {
  switch (first._tag) {
    case "Loop": {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            const [b, c] = first.f(accA, a)
            return Effect.map(second.f(accB, b), ([d, e]) => [d, [c, e]] as const)
          })
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            const [b, c] = first.f(accA, a)
            return Effect.map(second.f(accB, b), ([d, e]) => [d, [c, e]] as const)
          })
      }
    }
    case "FilterMapLoop": {
      switch (second._tag) {
        case "LoopEffect":
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            const [b, c] = first.f(accA, a)
            if (Option.isNone(b)) {
              return Effect.succeed([Option.none(), [c, accB]] as const)
            } else {
              return Effect.map(second.f(accB, b.value), ([d, e]) => [d, [c, e]] as const)
            }
          })
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            const [b, c] = first.f(accA, a)
            if (Option.isNone(b)) {
              return Effect.succeed([Option.none(), [c, accB]] as const)
            } else {
              return Effect.map(second.f(accB, b.value), ([d, e]) => [d, [c, e]] as const)
            }
          })
      }
    }
  }
}

export function fuseSyncLoopOperatorAfter(first: EffectLoopOperator, second: SyncLoopOperator): EffectLoopOperator {
  switch (first._tag) {
    case "LoopEffect": {
      switch (second._tag) {
        case "Loop": {
          return LoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            return Effect.map(first.f(accA, a), ([b, c]) => {
              const [d, e] = second.f(accB, b)
              return [d, [c, e]] as const
            })
          })
        }
        case "FilterMapLoop": {
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            return Effect.map(first.f(accA, a), ([b, c]) => {
              const [d, e] = second.f(accB, b)
              return [d, [c, e]] as const
            })
          })
        }
      }
    }
    case "FilterMapLoopEffect": {
      switch (second._tag) {
        case "Loop": {
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            return Effect.map(first.f(accA, a), ([b, c]) => {
              if (Option.isNone(b)) {
                return [Option.none(), [c, accB]] as const
              } else {
                const [d, e] = second.f(accB, b.value)
                return [Option.some(d), [c, e]] as const
              }
            })
          })
        }
        case "FilterMapLoop": {
          return FilterMapLoopEffectOperator([first.seed, second.seed], ([accA, accB], a) => {
            return Effect.map(first.f(accA, a), ([b, c]) => {
              if (Option.isNone(b)) {
                return [Option.none(), [c, accB]] as const
              } else {
                const [d, e] = second.f(accB, b.value)
                return [d, [c, e]] as const
              }
            })
          })
        }
      }
    }
  }
}

export function fuseSyncOperatorBefore(first: SyncOp.SyncOperator, second: EffectLoopOperator): EffectLoopOperator {
  return SyncOp.matchSyncOperator(first, {
    Map: (op) => {
      switch (second._tag) {
        case "LoopEffect": {
          return LoopEffectOperator(
            second.seed,
            (acc, a) => second.f(acc, op.f(a))
          )
        }
        case "FilterMapLoopEffect": {
          return FilterMapLoopEffectOperator(
            second.seed,
            (acc, a) => second.f(acc, op.f(a))
          )
        }
      }
    },
    Filter: (op) => {
      switch (second._tag) {
        case "LoopEffect": {
          return LoopEffectOperator(
            second.seed,
            (acc, a) => {
              if (op.f(a)) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }
          )
        }
        case "FilterMapLoopEffect": {
          return FilterMapLoopEffectOperator(
            second.seed,
            (acc, a) => {
              if (op.f(a)) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }
          )
        }
      }
    },
    FilterMap: (op) => {
      switch (second._tag) {
        case "LoopEffect": {
          return LoopEffectOperator(
            second.seed,
            (acc, a) => {
              return Option.match(op.f(a), {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (b) => second.f(acc, b)
              })
            }
          )
        }
        case "FilterMapLoopEffect": {
          return FilterMapLoopEffectOperator(
            second.seed,
            (acc, a) => {
              return Option.match(op.f(a), {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (b) => second.f(acc, b)
              })
            }
          )
        }
      }
    }
  })
}

export function fuseSyncOperatorAfter(first: EffectLoopOperator, second: SyncOp.SyncOperator): EffectLoopOperator {
  switch (first._tag) {
    case "LoopEffect": {
      return SyncOp.matchSyncOperator(second, {
        Map: (op): EffectLoopOperator =>
          LoopEffectOperator(first.seed, (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [op.f(b), c] as const)),
        Filter: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [Option.filter(b, op.f), c] as const)
          ),
        FilterMap: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [op.f(b), c] as const)
          )
      })
    }
    case "FilterMapLoopEffect": {
      return SyncOp.matchSyncOperator(second, {
        Map: (op): EffectLoopOperator =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [Option.map(b, op.f), c] as const)
          ),
        Filter: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [Option.filter(b, op.f), c] as const)
          ),
        FilterMap: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.map(first.f(acc, a), ([b, c]) => [Option.flatMap(b, op.f), c] as const)
          )
      })
    }
  }
}

export function fuseEffectOperatorBefore(
  first: EffectOp.EffectOperator,
  second: EffectLoopOperator
): EffectLoopOperator {
  return EffectOp.matchEffectOperator(first, {
    MapEffect: (op) => {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator(second.seed, (acc, a) => Effect.flatMap(op.f(a), (b) => second.f(acc, b)))
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(second.seed, (acc, a) => Effect.flatMap(op.f(a), (b) => second.f(acc, b)))
      }
    },
    TapEffect: (op) => {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator(second.seed, (acc, a) => Effect.flatMap(op.f(a), () => second.f(acc, a)))
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(second.seed, (acc, a) => Effect.flatMap(op.f(a), () => second.f(acc, a)))
      }
    },
    FilterEffect: (op) => {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator(second.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) => {
              if (b) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }))
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(second.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) => {
              if (b) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }))
      }
    },
    FilterMapEffect: (op) => {
      switch (second._tag) {
        case "LoopEffect":
          return LoopEffectOperator(second.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) =>
              Option.match(b, {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (c) => second.f(acc, c)
              })))
        case "FilterMapLoopEffect":
          return FilterMapLoopEffectOperator(second.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) =>
              Option.match(b, {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (c) => second.f(acc, c)
              })))
      }
    }
  })
}

export function fuseEffectOperatorAfter(
  first: EffectLoopOperator,
  second: EffectOp.EffectOperator
): EffectLoopOperator {
  switch (first._tag) {
    case "LoopEffect":
      return EffectOp.matchEffectOperator(second, {
        MapEffect: (op) =>
          LoopEffectOperator(
            first.seed,
            (acc, a) => Effect.flatMap(first.f(acc, a), ([b, c]) => Effect.map(op.f(b), (d) => [d, c] as const))
          ),
        TapEffect: (op) =>
          LoopEffectOperator(
            first.seed,
            (acc, a) => Effect.flatMap(first.f(acc, a), ([b, c]) => Effect.map(op.f(b), () => [b, c] as const))
          ),
        FilterEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) =>
              Effect.flatMap(first.f(acc, a), ([b, c]) =>
                Effect.map(op.f(b), (d) => d ? [Option.some(b), c] as const : [Option.none(), c] as const))
          ),
        FilterMapEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) => Effect.flatMap(first.f(acc, a), ([b, c]) => Effect.map(op.f(b), (d) => [d, c] as const))
          )
      })
    case "FilterMapLoopEffect":
      return EffectOp.matchEffectOperator(second, {
        MapEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) =>
              Effect.flatMap(first.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), (e) => [Option.some(e), c] as const)
                })
              })
          ),
        TapEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) =>
              Effect.flatMap(first.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), () => [Option.some(d), c] as const)
                })
              })
          ),
        FilterEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) =>
              Effect.flatMap(first.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) =>
                    Effect.map(op.f(d), (e) => e ? [Option.some(d), c] as const : [Option.none(), c] as const)
                })
              })
          ),
        FilterMapEffect: (op) =>
          FilterMapLoopEffectOperator(
            first.seed,
            (acc, a) =>
              Effect.flatMap(first.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), (e) => [e, c] as const)
                })
              })
          )
      })
  }
}

export function liftLoopOperator(op: SyncLoopOperator): EffectLoopOperator {
  switch (op._tag) {
    case "Loop":
      return LoopEffectOperator(op.seed, (acc, a) => Effect.succeed(op.f(acc, a)))
    case "FilterMapLoop":
      return FilterMapLoopEffectOperator(op.seed, (acc, a) => Effect.succeed(op.f(acc, a)))
  }
}
