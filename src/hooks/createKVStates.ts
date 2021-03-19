import { createKV, KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { UseState, UseState2, UseState3, UseState4 } from './UseState'

export const SHARED_STATES = Symbol('KVStates')

export function createKVStates<F extends URIS2, E = never>(
  M: FromIO2<F>,
): KV2<F, typeof SHARED_STATES, E, Map<any, UseState2<F, any>>>

export function createKVStates<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): KV3<F, typeof SHARED_STATES, R, E, Map<any, UseState3<F, any>>>

export function createKVStates<F extends URIS4, S = unknown, R = never, E = never>(
  M: FromIO4<F>,
): KV4<F, typeof SHARED_STATES, S, R, E, Map<any, UseState4<F, any>>>

export function createKVStates<F, E = never>(
  M: FromIO<F>,
): KV<F, typeof SHARED_STATES, E, Map<any, UseState<F, any>>>

export function createKVStates<F>(M: FromIO<F>) {
  const create = createKV<F>()

  return create(
    SHARED_STATES,
    M.fromIO(() => new Map<any, UseState<F, any>>()) as HKT2<F, any, Map<any, UseState<F, any>>>,
    EqStrict,
  )
}
