import { Arity1 } from '@typed/fp/common/types'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { useEffectBy } from '@typed/fp/hooks/additional/useEffectBy'
import { HookEnv } from '@typed/fp/hooks/core/exports'
import { Ref } from '@typed/fp/SharedRef/Ref'

import { useKeyManager } from './useKeyManager'

export function useListManager<A, B, C, E extends HookEnv, D>(
  list: ReadonlyArray<A>,
  identify: Arity1<A, B>,
  computation: Arity1<ListManagerValue<A, B, C>, Effect<E, D>>,
): Effect<E & EnvOf<typeof useEffectBy> & EnvOf<typeof useKeyManager>, ReadonlyArray<D>> {
  return useEffectBy(list, identify, (value, index, key) =>
    useKeyManager<B, E, C, D>(key, (ref) => computation({ value, index, key, ref })),
  )
}

export type ListManagerValue<A, B, C> = {
  readonly value: A
  readonly key: B
  readonly index: number
  readonly ref: Ref<C | null | undefined>
}
