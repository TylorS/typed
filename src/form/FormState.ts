import { Arity1 } from '@typed/fp/common/exports'
import { Pure } from '@typed/fp/Effect/exports'
import { UpdateState } from '@typed/fp/hooks/exports'

import { CurrentState } from './CurrentState'

export type FormState<A> = readonly [...CurrentState<A>, FormStateData, FormStateActions]

export type FormStateData = {
  readonly isPristine: boolean
  readonly isDirty: boolean
  readonly hasBeenSubmitted: boolean
}

export type FormStateActions = {
  readonly updateHasBeenSubmitted: UpdateState<boolean>
}

export const getFormState = <A>(state: FormState<A>): A => state[0]

export const updateFormState = <A>(state: FormState<A>, update: Arity1<A, A>): Pure<A> =>
  state[1](update)

export const getFormData = <A>(formState: FormState<A>) => formState[2]

export const getFormActions = <A>(formState: FormState<A>) => formState[3]

export const getFormIsPristine = <A>(formState: FormState<A>) => getFormData(formState).isPristine

export const getFormIsDirty = <A>(formState: FormState<A>) => getFormData(formState).isDirty

export const getFormHasBeenSubmitted = <A>(formState: FormState<A>) =>
  getFormData(formState).hasBeenSubmitted

export const updateHasBeenSubmitted = <A>(formState: FormState<A>, hasBeenSubmitted: boolean) =>
  getFormActions(formState).updateHasBeenSubmitted(() => hasBeenSubmitted)
