import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { createShared, Shared, Shared2, Shared3, Shared4 } from '@typed/fp/Shared'
import { UseState, UseState2, UseState3, UseState4 } from './UseState'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export const SHARED_STATES = Symbol('SharedStates')

export function createSharedStates<F extends URIS2, E = never>(
  M: FromIO2<F>,
): Shared2<F, typeof SHARED_STATES, E, Map<any, UseState2<F, any>>>

export function createSharedStates<F extends URIS3, R = never, E = never>(
  M: FromIO3<F>,
): Shared3<F, typeof SHARED_STATES, R, E, Map<any, UseState3<F, any>>>

export function createSharedStates<F extends URIS4, S = unknown, R = never, E = never>(
  M: FromIO4<F>,
): Shared4<F, typeof SHARED_STATES, S, R, E, Map<any, UseState4<F, any>>>

export function createSharedStates<F>(
  M: FromIO<F>,
): Shared<F, typeof SHARED_STATES, Map<any, UseState<F, any>>>

export function createSharedStates<F>(M: FromIO<F>) {
  const create = createShared<F>()

  return create(
    SHARED_STATES,
    M.fromIO(() => new Map<any, UseState<F, any>>()),
    EqStrict,
  )
}
