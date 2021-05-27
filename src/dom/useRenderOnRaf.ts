import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { liftEnv as _ } from '@fp/Fx/Env'
import * as H from '@fp/hooks'
import { useRef } from '@fp/hooks'
import { Eq, EqStrict } from 'fp-ts/Eq'

import { renderOnRaf } from './renderOnRaf'

const refOf = <A>(value: A, eq?: Eq<A>) => _(useRef(E.of(value), eq))
const useHasBeenUpdatedRef = refOf(true)

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const useRenderOnRaf = <E, A, B, Deps extends readonly any[]>(
  env: E.Env<E, A>,
  initial: B,
  options?: H.UseFiberOptions<Deps> & { readonly patchedEq?: Eq<B> },
) =>
  F.DoF(function* () {
    const Patched = yield* refOf<B>(initial, options?.patchedEq ?? EqStrict)
    const HasBeenUpdated = yield* useHasBeenUpdatedRef

    yield* _(H.useFiber(renderOnRaf(env, Patched, HasBeenUpdated), options))

    return yield* _(Patched.get)
  })
