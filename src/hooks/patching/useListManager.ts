import { Arity1 } from '@typed/fp/common/types'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { Ref } from '@typed/fp/SharedRef/Ref'

import { useEffectBy } from '../additional/useEffectBy'
import { HookEnv } from '../core/exports'
import { useKeyManager } from './useKeyManager'

export function useListManager<A, B, C, E extends HookEnv>(
  list: ReadonlyArray<A>,
  identify: Arity1<A, B>,
  computation: Arity1<ListManagerValue<A, B, C>, Effect<E, A>>,
): Effect<E & EnvOf<typeof useEffectBy> & EnvOf<typeof useKeyManager>, ReadonlyArray<A>> {
  return useEffectBy(list, identify, (value, index, key) =>
    useKeyManager<B, E, C, A>(key, (ref) => computation({ value, index, key, ref })),
  )
}

export type ListManagerValue<A, B, C> = {
  readonly value: A
  readonly key: B
  readonly index: number
  readonly ref: Ref<C | null | undefined>
}
