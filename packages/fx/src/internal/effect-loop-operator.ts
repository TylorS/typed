import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Sink from "../Sink.js"
import * as EffectOp from "./effect-operator.js"
import * as LoopOp from "./loop-operator.js"
import * as SyncOp from "./sync-operator.js"

export type EffectLoopOperator<B = any, A = any, R = any, E = any, C = any> =
  | LoopEffectOperator<B, A, R, E, C>
  | FilterMapLoopEffectOperator<B, A, R, E, C>

export interface LoopEffectOperator<B, A, R, E, C> {
  readonly _tag: "LoopEffect"
  readonly seed: B
  readonly f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
}

export function LoopEffectOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>
): LoopEffectOperator<B, A, R, E, C> {
  return { _tag: "LoopEffect", seed, f }
}

export interface FilterMapLoopEffectOperator<B, A, R, E, C> {
  readonly _tag: "FilterMapLoopEffect"
  readonly seed: B
  readonly f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R>
}

export function FilterMapLoopEffectOperator<const B, A, R, E, C>(
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R>
): FilterMapLoopEffectOperator<B, A, R, E, C> {
  return { _tag: "FilterMapLoopEffect", seed, f }
}

export function compileLoopEffectOperatorSink<R>(operator: EffectLoopOperator, sink: Sink.Sink<R, any, any>) {
  return matchEffectLoopOperator(operator, {
    LoopEffect: (op) => Sink.loopEffect(sink, op.seed, op.f),
    FilterMapLoopEffect: (op) => Sink.filterMapLoopEffect(sink, op.seed, op.f)
  })
}

export function fuseLoopEffectOperators(first: EffectLoopOperator, second: EffectLoopOperator): EffectLoopOperator {
  return matchEffectLoopOperator(first, {
    LoopEffect: (op1) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(
            [op1.seed, op2.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                op1.f(accA, accB),
                ([b, updatedA]) => Effect.map(op2.f(accA, b), ([c, updatedB]) => [c, [updatedA, updatedB]] as const)
              )
          ),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(
            [op1.seed, op2.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                op1.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(op2.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([Option.some(c), [updatedA, updatedB]] as const)
                  })
              )
          )
      }),
    FilterMapLoopEffect: (op1) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2) =>
          FilterMapLoopEffectOperator(
            [op1.seed, op2.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                op1.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(op2.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([Option.some(c), [updatedA, updatedB]] as const)
                  })
              )
          ),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(
            [op1.seed, op2.seed],
            ([accA, accB]) =>
              Effect.flatMap(
                op1.f(accA, accB),
                ([b, updatedA]) =>
                  Effect.matchEffect(op2.f(accA, b), {
                    onFailure: (cause) => Effect.failCause(cause),
                    onSuccess: ([c, updatedB]) => Effect.succeed([c, [updatedA, updatedB]] as const)
                  })
              )
          )
      })
  })
}

export function fuseSyncLoopOperatorBefore(
  first: LoopOp.SyncLoopOperator,
  second: EffectLoopOperator
): EffectLoopOperator {
  return LoopOp.matchSyncLoopOperator(first, {
    Loop: (op1) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [b, c] = op1.f(accA, a)
            return Effect.map(op2.f(accB, b), ([d, e]) => [d, [c, e]] as const)
          }),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [b, c] = op1.f(accA, a)
            return Effect.map(op2.f(accB, b), ([d, e]) => [d, [c, e]] as const)
          })
      }),
    FilterMapLoop: (op1) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [b, c] = op1.f(accA, a)
            if (Option.isNone(b)) {
              return Effect.succeed([Option.none(), [c, accB]] as const)
            } else {
              return Effect.map(op2.f(accB, b.value), ([d, e]) => [d, [c, e]] as const)
            }
          }),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [b, c] = op1.f(accA, a)
            if (Option.isNone(b)) {
              return Effect.succeed([Option.none(), [c, accB]] as const)
            } else {
              return Effect.map(op2.f(accB, b.value), ([d, e]) => [d, [c, e]] as const)
            }
          })
      })
  })
}

export function fuseSyncLoopOperatorAfter(
  first: EffectLoopOperator,
  second: LoopOp.SyncLoopOperator
): EffectLoopOperator {
  return matchEffectLoopOperator(first, {
    LoopEffect: (op1) =>
      LoopOp.matchSyncLoopOperator(second, {
        Loop: (op2): EffectLoopOperator =>
          LoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) =>
            Effect.map(op1.f(accA, a), ([b, c]) => {
              const [d, e] = op2.f(accB, b)
              return [d, [c, e]] as const
            })),
        FilterMapLoop: (op2) =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) =>
            Effect.map(op1.f(accA, a), ([b, c]) => {
              const [d, e] = op2.f(accB, b)
              return [d, [c, e]] as const
            }))
      }),
    FilterMapLoopEffect: (op1) =>
      LoopOp.matchSyncLoopOperator(second, {
        Loop: (op2) =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) =>
            Effect.map(op1.f(accA, a), ([b, c]) => {
              if (Option.isNone(b)) {
                return [Option.none(), [c, accB]] as const
              } else {
                const [d, e] = op2.f(accB, b.value)
                return [d, [c, e]] as const
              }
            })),
        FilterMapLoop: (op2) =>
          FilterMapLoopEffectOperator([op1.seed, op2.seed], ([accA, accB], a) =>
            Effect.map(op1.f(accA, a), ([b, c]) => {
              if (Option.isNone(b)) {
                return [Option.none(), [c, accB]] as const
              } else {
                const [d, e] = op2.f(accB, b.value)
                return [d, [c, e]] as const
              }
            }))
      })
  })
}

export function fuseSyncOperatorBefore(first: SyncOp.SyncOperator, second: EffectLoopOperator): EffectLoopOperator {
  return SyncOp.matchSyncOperator(first, {
    Map: (op) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator => LoopEffectOperator(op2.seed, (acc, a) => second.f(acc, op.f(a))),
        FilterMapLoopEffect: (op2) => FilterMapLoopEffectOperator(op2.seed, (acc, a) => second.f(acc, op.f(a)))
      }),
    Filter: (op) =>
      matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(
            op2.seed,
            (acc, a) => {
              if (op.f(a)) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }
          ),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(
            op2.seed,
            (acc, a) => {
              if (op.f(a)) {
                return second.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }
          )
      }),
    FilterMap: (op) => {
      return matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(
            op2.seed,
            (acc, a) => {
              return Option.match(op.f(a), {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (b) => second.f(acc, b)
              })
            }
          ),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(
            op2.seed,
            (acc, a) => {
              return Option.match(op.f(a), {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (b) => second.f(acc, b)
              })
            }
          )
      })
    }
  })
}

export function fuseSyncOperatorAfter(first: EffectLoopOperator, second: SyncOp.SyncOperator): EffectLoopOperator {
  return matchEffectLoopOperator(first, {
    LoopEffect: (op1) =>
      SyncOp.matchSyncOperator(second, {
        Map: (op): EffectLoopOperator =>
          LoopEffectOperator(op1.seed, (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [op.f(b), c] as const)),
        Filter: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [Option.filter(b, op.f), c] as const)
          ),
        FilterMap: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [op.f(b), c] as const)
          )
      }),
    FilterMapLoopEffect: (op1) =>
      SyncOp.matchSyncOperator(second, {
        Map: (op): EffectLoopOperator =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [Option.map(b, op.f), c] as const)
          ),
        Filter: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [Option.filter(b, op.f), c] as const)
          ),
        FilterMap: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.map(op1.f(acc, a), ([b, c]) => [Option.flatMap(b, op.f), c] as const)
          )
      })
  })
}

export function fuseEffectOperatorBefore(
  first: EffectOp.EffectOperator,
  second: EffectLoopOperator
): EffectLoopOperator {
  return EffectOp.matchEffectOperator(first, {
    MapEffect: (op) => {
      return matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(op2.seed, (acc, a) => Effect.flatMap(op.f(a), (b) => op2.f(acc, b))),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(op2.seed, (acc, a) => Effect.flatMap(op.f(a), (b) => op2.f(acc, b)))
      })
    },
    TapEffect: (op) => {
      return matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(op2.seed, (acc, a) => Effect.flatMap(op.f(a), () => op2.f(acc, a))),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(op2.seed, (acc, a) => Effect.flatMap(op.f(a), () => op2.f(acc, a)))
      })
    },
    FilterEffect: (op) => {
      return matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(op2.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) => {
              if (b) {
                return op2.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            })),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(op2.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) => {
              if (b) {
                return op2.f(acc, a)
              } else {
                return Effect.succeed([Option.none(), acc] as const)
              }
            }))
      })
    },
    FilterMapEffect: (op) => {
      return matchEffectLoopOperator(second, {
        LoopEffect: (op2): EffectLoopOperator =>
          LoopEffectOperator(op2.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) =>
              Option.match(b, {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (c) => op2.f(acc, c)
              }))),
        FilterMapLoopEffect: (op2) =>
          FilterMapLoopEffectOperator(op2.seed, (acc, a) =>
            Effect.flatMap(op.f(a), (b) =>
              Option.match(b, {
                onNone: () => Effect.succeed([Option.none(), acc] as const),
                onSome: (c) => op2.f(acc, c)
              })))
      })
    }
  })
}

export function fuseEffectOperatorAfter(
  first: EffectLoopOperator,
  second: EffectOp.EffectOperator
): EffectLoopOperator {
  return matchEffectLoopOperator(first, {
    LoopEffect: (op1) =>
      EffectOp.matchEffectOperator(second, {
        MapEffect: (op) =>
          LoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.flatMap(op1.f(acc, a), ([b, c]) => Effect.map(op.f(b), (d) => [d, c] as const))
          ),
        TapEffect: (op) =>
          LoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.flatMap(op1.f(acc, a), ([b, c]) => Effect.map(op.f(b), () => [b, c] as const))
          ),
        FilterEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) =>
              Effect.flatMap(
                op1.f(acc, a),
                ([b, c]) => Effect.map(op.f(b), (d) => d ? [Option.some(b), c] as const : [Option.none(), c] as const)
              )
          ),
        FilterMapEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) => Effect.flatMap(op1.f(acc, a), ([b, c]) => Effect.map(op.f(b), (d) => [d, c] as const))
          )
      }),
    FilterMapLoopEffect: (op1) =>
      EffectOp.matchEffectOperator(second, {
        MapEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) =>
              Effect.flatMap(op1.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), (e) => [Option.some(e), c] as const)
                })
              })
          ),
        TapEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) =>
              Effect.flatMap(op1.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), () => [Option.some(d), c] as const)
                })
              })
          ),
        FilterEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) =>
              Effect.flatMap(op1.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) =>
                    Effect.map(op.f(d), (e) => e ? [Option.some(d), c] as const : [Option.none(), c] as const)
                })
              })
          ),
        FilterMapEffect: (op) =>
          FilterMapLoopEffectOperator(
            op1.seed,
            (acc, a) =>
              Effect.flatMap(op1.f(acc, a), ([b, c]) => {
                return Option.match(b, {
                  onNone: () => Effect.succeed([Option.none(), c] as const),
                  onSome: (d) => Effect.map(op.f(d), (e) => [e, c] as const)
                })
              })
          )
      })
  })
}

// TODO: We should probably do more specific fusions
export function liftLoopOperator(op: LoopOp.SyncLoopOperator): EffectLoopOperator {
  return LoopOp.matchSyncLoopOperator(op, {
    Loop: (op): EffectLoopOperator => LoopEffectOperator(op.seed, (acc, a) => Effect.succeed(op.f(acc, a))),
    FilterMapLoop: (op) => FilterMapLoopEffectOperator(op.seed, (acc, a) => Effect.succeed(op.f(acc, a)))
  })
}

export function matchEffectLoopOperator<A, B, R, E, C, D>(
  operator: EffectLoopOperator<A, B, R, E, C>,
  matchers: {
    LoopEffect: (op: LoopEffectOperator<A, B, R, E, C>) => D
    FilterMapLoopEffect: (op: FilterMapLoopEffectOperator<A, B, R, E, C>) => D
  }
): D {
  if (operator._tag === "LoopEffect") {
    return matchers.LoopEffect(operator)
  } else {
    return matchers.FilterMapLoopEffect(operator)
  }
}

export function compileCauseLoopEffectOperatorSinkCause<R>(
  operator: EffectLoopOperator,
  sink: Sink.Sink<R, any, any>
): Sink.Sink<R, any, any> {
  return matchEffectLoopOperator(operator, {
    LoopEffect: (op) => Sink.loopCauseEffect(sink, op.seed, op.f),
    FilterMapLoopEffect: (op) => Sink.filterMapLoopCauseEffect(sink, op.seed, op.f)
  })
}
