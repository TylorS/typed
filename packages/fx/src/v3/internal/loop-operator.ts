import { Option } from "effect"
import * as Sink from "../Sink.js"
import * as SyncOp from "./sync-operator.js"

export type SyncLoopOperator<B = any, A = any, C = any> =
  | LoopOperator<B, A, C>
  | FilterMapLoopOperator<B, A, C>

export interface LoopOperator<B, A, C> {
  readonly _tag: "Loop"
  readonly seed: B
  readonly f: (acc: B, a: A) => readonly [C, B]
}

export function LoopOperator<const B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): LoopOperator<B, A, C> {
  return { _tag: "Loop", seed, f }
}

export interface FilterMapLoopOperator<B, A, C> {
  readonly _tag: "FilterMapLoop"
  readonly seed: B
  readonly f: (acc: B, a: A) => readonly [Option.Option<C>, B]
}

export function FilterMapLoopOperator<const B, A, C>(
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): FilterMapLoopOperator<B, A, C> {
  return { _tag: "FilterMapLoop", seed, f }
}

export function matchSyncLoopOperator<A, B, C, D>(operator: SyncLoopOperator<A, B, C>, matchers: {
  Loop: (op: LoopOperator<A, B, C>) => D
  FilterMapLoop: (op: FilterMapLoopOperator<A, B, C>) => D
}): D {
  if (operator._tag === "Loop") {
    return matchers.Loop(operator)
  } else {
    return matchers.FilterMapLoop(operator)
  }
}

export function fuseSyncOperatorBefore(
  syncOp: SyncOp.SyncOperator,
  loopOp: SyncLoopOperator
): SyncLoopOperator {
  return SyncOp.matchSyncOperator(syncOp, {
    Map: (op): SyncLoopOperator =>
      matchSyncLoopOperator(loopOp, {
        Loop: (lOp): SyncLoopOperator => LoopOperator(lOp.seed, (acc, a) => lOp.f(acc, op.f(a))),
        FilterMapLoop: (lOp) => FilterMapLoopOperator(lOp.seed, (acc, a) => lOp.f(acc, op.f(a)))
      }),
    Filter: (op) =>
      matchSyncLoopOperator(loopOp, {
        Loop: (lOp): SyncLoopOperator =>
          FilterMapLoopOperator(lOp.seed, (acc, a) => {
            const [b, c] = lOp.f(acc, a)
            if (op.f(b)) {
              return [Option.some(b), c]
            } else {
              return [Option.none(), c]
            }
          }),
        FilterMapLoop: (lOp) =>
          FilterMapLoopOperator(lOp.seed, (acc, a) => {
            if (op.f(a)) {
              return [Option.none(), acc]
            } else {
              return lOp.f(acc, a)
            }
          })
      }),
    FilterMap: (op) =>
      matchSyncLoopOperator(loopOp, {
        Loop: (lOp): SyncLoopOperator =>
          FilterMapLoopOperator(lOp.seed, (acc, a) => {
            const [b, c] = lOp.f(acc, a)
            return [op.f(b), c]
          }),
        FilterMapLoop: (lOp) =>
          FilterMapLoopOperator(lOp.seed, (acc, a) => {
            const [b, c] = lOp.f(acc, a)
            return [Option.flatMap(b, op.f), c]
          })
      })
  })
}

export function fuseSyncOperatorAfter(
  loopOp: SyncLoopOperator,
  syncOp: SyncOp.SyncOperator
): SyncLoopOperator {
  return matchSyncLoopOperator(loopOp, {
    Loop: (loopOp) =>
      SyncOp.matchSyncOperator(syncOp, {
        Map: (op): SyncLoopOperator =>
          LoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            return [op.f(b), c]
          }),
        Filter: (op) =>
          FilterMapLoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            if (op.f(b)) {
              return [Option.some(b), c]
            } else {
              return [Option.none(), c]
            }
          }),
        FilterMap: (op) =>
          FilterMapLoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            return Option.match(op.f(b), {
              onNone: () => [Option.none(), c],
              onSome: (d) => [Option.some(d), c]
            })
          })
      }),
    FilterMapLoop: (loopOp) =>
      SyncOp.matchSyncOperator(syncOp, {
        Map: (op): SyncLoopOperator =>
          FilterMapLoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            return [Option.map(b, op.f), c]
          }),
        Filter: (op) =>
          FilterMapLoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            return [Option.filter(b, op.f), c]
          }),
        FilterMap: (op) =>
          FilterMapLoopOperator(loopOp.seed, (acc, a) => {
            const [b, c] = loopOp.f(acc, a)
            return [Option.flatMap(b, op.f), c]
          })
      })
  })
}

export function fuseLoopOperators<A, B, C, D, E>(
  first: SyncLoopOperator<A, B, C>,
  second: SyncLoopOperator<D, C, E>
): SyncLoopOperator<readonly [A, D], B, E> {
  return matchSyncLoopOperator(first, {
    Loop: (op1) =>
      matchSyncLoopOperator(second, {
        Loop: (op2): SyncLoopOperator<readonly [A, D], B, E> =>
          LoopOperator([op1.seed, op2.seed], ([accA, accB], a: B) => {
            const [c, b] = op1.f(accA, a)
            const [e, d] = op2.f(accB, c)
            return [e, [b, d]]
          }),
        FilterMapLoop: (op2) =>
          FilterMapLoopOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [c, b] = op1.f(accA, a)
            const [e, d] = op2.f(accB, c)
            return [e, [b, d]]
          })
      }),
    FilterMapLoop: (op1) =>
      matchSyncLoopOperator(second, {
        Loop: (op2): SyncLoopOperator<readonly [A, D], B, E> =>
          FilterMapLoopOperator([op1.seed, op2.seed], ([accA, accB], a: B) => {
            const [c, b] = op1.f(accA, a)
            if (Option.isNone(c)) {
              return [Option.none(), [b, accB]] as const
            }
            const [e, d] = op2.f(accB, c.value)
            return [Option.some(e), [b, d]] as const
          }),
        FilterMapLoop: (op2) =>
          FilterMapLoopOperator([op1.seed, op2.seed], ([accA, accB], a) => {
            const [c, b] = op1.f(accA, a)
            if (Option.isNone(c)) {
              return [Option.none(), [b, accB]]
            }
            const [e, d] = op2.f(accB, c.value)
            return [e, [b, d]]
          })
      })
  })
}

export function compileLoopOperatorSink<R>(operator: SyncLoopOperator, sink: Sink.Sink<R, any, any>) {
  return matchSyncLoopOperator(operator, {
    Loop: (op) => Sink.loop(sink, op.seed, op.f),
    FilterMapLoop: (op) => Sink.filterMapLoop(sink, op.seed, op.f)
  })
}

export function applyArray<A, B>(array: ReadonlyArray<A>, operator: SyncLoopOperator): ReadonlyArray<B> {
  return matchSyncLoopOperator(operator, {
    Loop: (op) => loopArray(array, op.seed, op.f),
    FilterMapLoop: (op) => filterMapLoopArray(array, op.seed, op.f)
  })
}

function loopArray<A, B, C>(array: ReadonlyArray<A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): ReadonlyArray<C> {
  const result = new Array<C>(array.length)
  let acc = seed
  for (let i = 0; i < array.length; i++) {
    const [c, b] = f(acc, array[i])
    result[i] = c
    acc = b
  }
  return result
}

function filterMapLoopArray<A, B, C>(
  array: ReadonlyArray<A>,
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): ReadonlyArray<C> {
  const result = new Array<C>()
  let acc = seed
  for (let i = 0; i < array.length; i++) {
    const [option, b] = f(acc, array[i])
    if (Option.isSome(option)) {
      result.push(option.value)
    }
    acc = b
  }
  return result
}
