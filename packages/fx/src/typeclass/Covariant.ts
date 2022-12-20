import * as C from '@fp-ts/core/typeclass/Covariant'

import { Fx } from '../Fx.js'
import { map } from '../operator/map.js'

import { FxTypeLambda } from './TypeLambda.js'

export const Covariant: C.Covariant<FxTypeLambda> = C.make((f) => map(f))

export const flap: <A>(a: A) => <R, E, B>(self: Fx<R, E, (a: A) => B>) => Fx<R, E, B> =
  C.flap(Covariant)

export const imap: <A, B>(
  to: (a: A) => B,
  from: (b: B) => A,
) => <R, E>(self: Fx<R, E, A>) => Fx<R, E, B> = C.imap<FxTypeLambda>(Covariant.map)

const let_: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => B,
) => <R, E>(
  self: Fx<R, E, A>,
) => Fx<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = C.let(Covariant)

export { let_ as let }
