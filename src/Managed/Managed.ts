import { Exit } from '@/Exit'
import * as Fx from '@/Fx'
import { pipe } from '@/Prelude/function'
import { Finalizer } from '@/Scope'
import { ReleaseMap } from '@/Scope/ReleaseMap'

/**
 * A type used to help acquire resources which need to be released in the event of success or failure.
 */
export interface Managed<R, E, A> {
  readonly fx: Fx.Fx<ReleaseMapEnv<R>, E, readonly [Finalizer, A]>
}

export interface ReleaseMapEnv<R> {
  readonly requirements: R
  readonly releaseMap: ReleaseMap
}

/**
 * Type-level helper for extracting the requirements needed to run a Managed type.
 */
export type RequirementsOf<A> = [A] extends [Managed<infer R, infer _, infer _>] ? R : never

/**
 * Type-level helper for extracting the expected error of a Managed.
 */
export type ErrorOf<A> = [A] extends [Managed<infer _, infer E, infer _>] ? E : never

/**
 * Type-level helper for extracting the computed value of a Managed.
 */
export type ValueOf<A> = [A] extends [Managed<infer _, infer _, infer R>] ? R : never

/**
 * Construct a Managed type.
 */
export function make<R, E, A, R2, E2>(
  acquire: Fx.Fx<R, E, A>,
  release: (value: A) => Fx.Fx<R2, E2, any>,
): Managed<R & R2, E | E2, A> {
  return {
    fx: Fx.Fx(function* () {
      const { requirements, releaseMap } = yield* Fx.ask<ReleaseMapEnv<R & R2>>()

      const a = yield* pipe(acquire, Fx.provideAll(requirements))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const symbol = yield* releaseMap.add((_: Exit<any, any>) =>
        pipe(a, release, Fx.provideAll(requirements)),
      )

      return [(exit: Exit<any, any>) => releaseMap.release(symbol, exit), a] as const
    }),
  }
}
