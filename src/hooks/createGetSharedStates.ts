import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO } from 'fp-ts/dist/FromIO'
import { createShared } from '@typed/fp/Shared'
import { UseState } from './UseState'

export const SHARED_STATES = Symbol('SharedStates')

export function createSharedStates<F>(M: FromIO<F>) {
  const create = createShared<F>()

  return create(
    SHARED_STATES,
    M.fromIO(() => new Map<any, UseState<F, any>>()),
    EqStrict,
  )
}
