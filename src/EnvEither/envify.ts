import { fromTask } from '@typed/fp/Eff'
import { PureEither } from '@typed/fp/FxEither'
import { left, right } from 'fp-ts/Either'

export function envify<L, R>(
  f: (cb: (e: L | null | undefined, r?: R) => void) => void,
): () => PureEither<L, R>

export function envify<A, L, R>(
  f: (a: A, cb: (e: L | null | undefined, r?: R) => void) => void,
): (a: A) => PureEither<L, R>

export function envify<A, B, L, R>(
  f: (a: A, b: B, cb: (e: L | null | undefined, r?: R) => void) => void,
): (a: A, b: B) => PureEither<L, R>

export function envify<A, B, C, L, R>(
  f: (a: A, b: B, c: C, cb: (e: L | null | undefined, r?: R) => void) => void,
): (a: A, b: B, c: C) => PureEither<L, R>

export function envify<A, B, C, D, L, R>(
  f: (a: A, b: B, c: C, d: D, cb: (e: L | null | undefined, r?: R) => void) => void,
): (a: A, b: B, c: C, d: D) => PureEither<L, R>

export function envify<A, B, C, D, E, L, R>(
  f: (a: A, b: B, c: C, d: D, e: E, cb: (e: L | null | undefined, r?: R) => void) => void,
): (a: A, b: B, c: C, d: D, e: E) => PureEither<L, R>

export function envify<L, R>(f: Function): () => PureEither<L, R> {
  return function (...args: readonly any[]) {
    return fromTask(
      () =>
        new Promise((resolve) => {
          const cbResolver = (e: L, r: R) => (e != null ? resolve(left(e)) : resolve(right(r)))

          f.call(null, ...args, cbResolver)
        }),
    ) as PureEither<L, R>
  }
}
