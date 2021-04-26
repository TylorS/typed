import { Env } from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { deleteRef, getRef, modifyRef_, Ref, Refs, setRef_ } from '@fp/Ref'
import { Endomorphism } from 'fp-ts/Endomorphism'

import { CurrentFiber, withFiberRefs } from './Fiber'
import { findProvider } from './findProvider'

/**
 * Mirroring that of the standard get/set/delete/modify Ref already has, but with the
 * ability to traverse up the Fiber tree to help share data between fibers.
 * */
export const withProvider = <E1, A>(ref: Ref<E1, A>) => <E2, B>(
  f: (ref: Ref<E1, A>) => Env<E2 & Refs, B>,
): Env<CurrentFiber<any> & E1 & E2, B> =>
  Do(function* (_) {
    const provider = yield* _(findProvider(ref))

    return yield* pipe(ref, f, withFiberRefs(provider), _)
  })

export const getContext = <E, A>(ref: Ref<E, A>): Env<E & CurrentFiber, A> =>
  withProvider(ref)(getRef)

export const setContext = <E, A>(ref: Ref<E, A>) => (value: A) => withProvider(ref)(setRef_(value))

export const deleteContext = <E, A>(ref: Ref<E, A>) => withProvider(ref)(deleteRef)

export const modifyContext = <E, A>(ref: Ref<E, A>) => (f: Endomorphism<A>) =>
  withProvider(ref)(modifyRef_(f))
