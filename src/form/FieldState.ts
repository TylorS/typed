import { Arity1 } from '@typed/fp/common/types'
import { Pure } from '@typed/fp/Effect/exports'
import { UpdateState } from '@typed/fp/hooks/exports'
import { Eq } from 'fp-ts/Eq'

import { CurrentState } from './CurrentState'

/**
 * The current state enriched with field-specific metadata and actions.
 */
export type FieldState<K, A> = readonly [...CurrentState<A>, FieldData<K, A>, FieldActions]

export type FieldData<K, A> = {
  readonly key: K
  readonly eq: Eq<A>
  readonly isDirty: boolean
  readonly isPristine: boolean
  readonly hasBlurred: boolean
}

export type FieldActions = {
  readonly updateHasBlurred: UpdateState<boolean>
}

export type FieldValue<A> = A extends FieldState<any, infer R>
  ? R
  : A extends FieldData<any, infer R>
  ? R
  : never

export type FieldKeyOf<A> = A extends FieldState<infer R, any>
  ? R
  : A extends FieldData<infer R, any>
  ? R
  : never

export const getFieldState = <K, A>(state: FieldState<K, A>): A => state[0]

export const updateFieldState = <K, A>(state: FieldState<K, A>, update: Arity1<A, A>): Pure<A> =>
  state[1](update)

export const getFieldData = <K, A>(state: FieldState<K, A>): FieldData<K, A> => state[2]

export const getFieldActions = <K, A>(state: FieldState<K, A>): FieldActions => state[3]

export const getFieldKey = <K, A>(state: FieldState<K, A>): K => getFieldData(state).key

export const getFieldEq = <K, A>(state: FieldState<K, A>): Eq<A> => getFieldData(state).eq

export const getFieldIsDirty = <K, A>(state: FieldState<K, A>): boolean =>
  getFieldData(state).isDirty

export const getFieldIsPristine = <K, A>(state: FieldState<K, A>): boolean =>
  getFieldData(state).isPristine

export const getFieldHasBlurred = <K, A>(state: FieldState<K, A>): boolean =>
  getFieldData(state).hasBlurred

export const setFieldHasBlurred = <K, A>(
  state: FieldState<K, A>,
  blurred: boolean,
): Pure<boolean> => getFieldActions(state).updateHasBlurred(() => blurred)
