import { U } from 'ts-toolbelt'

import { Fx } from './Fx'

/**
 * Use generators as do-notation for effects
 */
export const doFx = <Y, R>(f: () => Generator<Y, R, any>): Fx<readonly [...U.ListOf<Y>], R> => ({
  [Symbol.iterator]: () => f(),
})
