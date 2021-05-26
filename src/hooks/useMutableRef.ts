import { Env, map } from '@fp/Env'
import { pipe } from '@fp/function'

import { useMemo } from './useMemo'

export interface MutableRef<A> {
  current: A
}

export function makeMutableRef<A>(initial: A): MutableRef<A> {
  return {
    current: initial,
  }
}

export function useMutableRef<E, A>(initial: Env<E, A>) {
  return pipe(initial, map(makeMutableRef), useMemo)
}
