import deepEqual from 'fast-deep-equal'
import { Eq } from 'fp-ts/Eq'
import { constFalse, constTrue } from 'fp-ts/function'

export const DeepEqual: Eq<unknown> = {
  equals: deepEqual,
}

export const NeverEqual: Eq<unknown> = {
  equals: constFalse,
}

export const AlwaysEqual: Eq<unknown> = {
  equals: constTrue,
}
