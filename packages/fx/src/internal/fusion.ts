import * as Chunk from "@effect/data/Chunk"

export type FusionDecision<T> = Append<T> | Replace<T> | Commute<T>

export type Append<T> = {
  readonly _tag: "Append"
  readonly operator: T
}

export function Append<T>(operator: T): FusionDecision<T> {
  return {
    _tag: "Append",
    operator
  }
}

export type Replace<T> = {
  readonly _tag: "Replace"
  readonly operator: T
}

export function Replace<T>(operator: T): FusionDecision<T> {
  return {
    _tag: "Replace",
    operator
  }
}

export type Commute<T> = {
  readonly _tag: "Commute"
  readonly operator: T
}

export function Commute<T>(operator: T): FusionDecision<T> {
  return {
    _tag: "Commute",
    operator
  }
}

export function matchFusionDecision<T, A, B, C>(
  decision: FusionDecision<T>,
  matchers: {
    readonly Append: (operator: T) => A
    readonly Replace: (operator: T) => B
    readonly Commute: (operator: T) => C
  }
): A | B | C {
  return matchers[decision._tag](decision.operator)
}

export function applyFusionDecision<T>(
  chunk: Chunk.Chunk<T>,
  next: T,
  makeDecision: (operator: T, next: T) => FusionDecision<T>
): Chunk.NonEmptyChunk<T> {
  const size = Chunk.size(chunk)

  if (size === 0) return Chunk.of(next)

  const last = Chunk.unsafeLast(chunk)
  const decision = makeDecision(last, next)

  return matchFusionDecision(decision, {
    Append: (operator) => Chunk.append(chunk, operator),
    Replace: (operator) => Chunk.replace(chunk, size - 1, operator) as Chunk.NonEmptyChunk<T>,
    Commute: (operator) => Chunk.append(applyFusionDecision(Chunk.dropRight(chunk, 1), operator, makeDecision), last)
  })
}
