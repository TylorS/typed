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
