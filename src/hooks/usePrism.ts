import { isNone, Option } from 'fp-ts/es6/Option'
import { Prism } from 'monocle-ts'

import { Arity1 } from '../common'
import { doEffect, Effect, map } from '../Effect'
import { HookEnv, UseState } from './HookEnvironment'
import { useMemo } from './useMemo'

export const usePrism = <A, B>(
  prism: Prism<A, B>,
  [getA, updateA]: UseState<A>,
): Effect<HookEnv, UseState<Option<B>>> =>
  doEffect(function* () {
    const getB = yield* useMemo((p, g) => map(p.getOption, g), [prism, getA] as const)
    const updateB = yield* useMemo(
      (p, ua) => <E>(ub: Arity1<Option<B>, Effect<E, Option<B>>>) =>
        map(
          p.getOption,
          ua<E>((a) =>
            doEffect(function* () {
              const optionB = p.getOption(a)
              const updatedB = yield* ub(optionB)

              if (isNone(updatedB)) {
                return yield* getA
              }

              return p.reverseGet(updatedB.value)
            }),
          ),
        ),
      [prism, updateA] as const,
    )

    return [getB, updateB] as const
  })
