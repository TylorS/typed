import type { Unify } from "effect"
import type { Kind, TypeLambda } from "effect/HKT"
import type { Fx } from "./Fx"

export const FusableTypeId = Symbol.for("@typed/fx/Fusable")
export type FusableTypeId = typeof FusableTypeId

export interface Fusable {
  readonly [FusableTypeId]: PropertyKey
}

export function checkFusable<const Keys extends ReadonlyArray<PropertyKey>>(input: Keys) {
  const keys = new Set(input)

  return <I extends Keys[number]>(i: I): boolean => keys.has(i)
}

export interface FusionMap {}

type GetFusionKind<T extends PropertyKey, R, E, A> = T extends keyof FusionMap
  ? FusionMap[T] extends TypeLambda ? Kind<FusionMap[T], unknown, R, E, A> : Fx<R, E, A>
  : Fx<R, E, A>

export function isFusable<R, E, A>(fx: Fx<R, E, A>): fx is Fx<R, E, A> & Fusable {
  return FusableTypeId in fx
}

export function matchFusable<
  R,
  E,
  A,
  const Keys extends ReadonlyArray<PropertyKey>,
  const Matchers extends MatchersOf<Keys[number], R, E, A>
>(
  fx: Fx<R, E, A>,
  keys: Keys,
  matchers: Matchers
): Unify.Unify<ReturnType<Matchers[keyof Matchers]>> {
  if (isFusable(fx)) {
    const key = fx[FusableTypeId]
    if (keys.includes(key)) return (matchers as any)[key](fx as any)
  }

  return matchers._(fx)
}

type MatchersOf<Keys extends PropertyKey, R, E, A> =
  & {
    readonly [K in Keys]: (fx: GetFusionKind<K, R, E, A>) => any
  }
  & {
    _: (fx: Fx<R, E, A>) => any
  }
