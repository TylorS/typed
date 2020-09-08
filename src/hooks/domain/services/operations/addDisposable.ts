import { Disposable } from '@most/types'
import { Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

export const ADD_DISPOSABLE = Symbol()
export type ADD_DISPOSABLE = typeof ADD_DISPOSABLE

export interface AddDisposableOp
  extends Op<ADD_DISPOSABLE, (disposable: Disposable) => Pure<Disposable>> {}

export const AddDisposableOp = createOp<AddDisposableOp>(ADD_DISPOSABLE)

export const addDisposable = callOp(AddDisposableOp)
