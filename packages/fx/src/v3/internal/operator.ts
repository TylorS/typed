import type { Sink } from "../Sink"
import * as EffectLoopOp from "./effect-loop-operator"
import * as EffectOp from "./effect-operator"
import * as LoopOp from "./loop-operator"
import * as SyncOp from "./sync-operator"

export type Operator =
  | SyncOp.SyncOperator
  | EffectOp.EffectOperator
  | LoopOp.SyncLoopOperator
  | EffectLoopOp.EffectLoopOperator

export function matchOperator<A>(operator: Operator, matchers: {
  SyncOperator: (op: SyncOp.SyncOperator) => A
  EffectOperator: (op: EffectOp.EffectOperator) => A
  SyncLoopOperator: (op: LoopOp.SyncLoopOperator) => A
  EffectLoopOperator: (op: EffectLoopOp.EffectLoopOperator) => A
}): A {
  switch (operator._tag) {
    case "Map":
    case "Filter":
    case "FilterMap":
      return matchers.SyncOperator(operator)
    case "MapEffect":
    case "TapEffect":
    case "FilterEffect":
    case "FilterMapEffect":
      return matchers.EffectOperator(operator)
    case "Loop":
    case "FilterMapLoop":
      return matchers.SyncLoopOperator(operator)
    case "LoopEffect":
    case "FilterMapLoopEffect":
      return matchers.EffectLoopOperator(operator)
  }
}

export function fuseOperators(first: Operator, second: Operator): Operator {
  return matchOperator(first, {
    SyncOperator: (op1) =>
      matchOperator(second, {
        SyncOperator: (op2): Operator => SyncOp.fuseSyncOperators(op1, op2),
        EffectOperator: (op2) => EffectOp.fuseEffectOperators(EffectOp.liftSyncOperator(op1), op2),
        SyncLoopOperator: (op2) => LoopOp.fuseSyncOperatorBefore(op1, op2),
        EffectLoopOperator: (op2) => EffectLoopOp.fuseSyncOperatorBefore(op1, op2)
      }),
    EffectOperator: (op1) =>
      matchOperator(second, {
        SyncOperator: (op2): Operator => EffectOp.fuseEffectOperators(op1, EffectOp.liftSyncOperator(op2)),
        EffectOperator: (op2) => EffectOp.fuseEffectOperators(op1, op2),
        SyncLoopOperator: (op2) => EffectLoopOp.fuseEffectOperatorBefore(op1, EffectLoopOp.liftLoopOperator(op2)),
        EffectLoopOperator: (op2) => EffectLoopOp.fuseEffectOperatorBefore(op1, op2)
      }),
    SyncLoopOperator: (op1) =>
      matchOperator(second, {
        SyncOperator: (op2): Operator => LoopOp.fuseSyncOperatorAfter(op1, op2),
        EffectOperator: (op2) => EffectLoopOp.fuseEffectOperatorAfter(EffectLoopOp.liftLoopOperator(op1), op2),
        SyncLoopOperator: (op2) => LoopOp.fuseLoopOperators(op1, op2),
        EffectLoopOperator: (op2) => EffectLoopOp.fuseSyncLoopOperatorBefore(op1, op2)
      }),
    EffectLoopOperator: (op1) =>
      matchOperator(second, {
        SyncOperator: (op2): Operator => EffectLoopOp.fuseSyncOperatorAfter(op1, op2),
        EffectOperator: (op2) => EffectLoopOp.fuseEffectOperatorAfter(op1, op2),
        SyncLoopOperator: (op2) => EffectLoopOp.fuseSyncLoopOperatorAfter(op1, op2),
        EffectLoopOperator: (op2) => EffectLoopOp.fuseLoopEffectOperators(op1, op2)
      })
  })
}

export function compileOperatorSink<R, R2>(operator: Operator, sink: Sink<R, any, any>): Sink<R | R2, any, any> {
  return matchOperator(operator, {
    SyncOperator: (op) => SyncOp.compileSyncOperatorSink(op, sink),
    EffectOperator: (op) => EffectOp.compileEffectOperatorSink(op, sink),
    SyncLoopOperator: (op) => LoopOp.compileLoopOperatorSink(op, sink),
    EffectLoopOperator: (op) => EffectLoopOp.compileLoopEffectOperatorSink(op, sink)
  })
}
