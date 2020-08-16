import { Arity1 } from '@typed/fp/common'
import { doEffect, Effect, map } from '@typed/fp/Effect'
import { pipe } from 'fp-ts/es6/function'
import { isNone, Option } from 'fp-ts/es6/Option'
import { Optional } from 'monocle-ts/es6/Optional'

import { HookEnv, UseState } from './HookEnvironment'
import { useMemo } from './useMemo'

export function useOptional<A, B>(
  optional: Optional<A, B>,
  [getA, updateA]: UseState<A>,
): Effect<HookEnv, UseState<Option<B>>> {
  return doEffect(function* () {
    const getB = yield* useMemo((o, g) => map(o.getOption, g), [optional, getA] as const)
    const updateB = yield* useMemo(
      (o, ua) => <E>(ub: Arity1<Option<B>, Effect<E, Option<B>>>) =>
        map(
          o.getOption,
          ua<E>((a) =>
            doEffect(function* () {
              const optionB = o.getOption(a)
              const updatedB = yield* ub(optionB)

              if (isNone(updatedB)) {
                return yield* getA
              }

              return pipe(a, o.set(updatedB.value))
            }),
          ),
        ),
      [optional, updateA] as const,
    )

    return [getB, updateB] as const
  })
}
