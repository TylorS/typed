import { Disposable } from '@typed/fp/Disposable'
import { curry } from '../lambda'
import { PureEffect } from './Effect'

const runEffectUncurried = <A>(f: (value: A) => Disposable, effect: PureEffect<A>): Disposable =>
  effect({})(f)

export const runEffect: {
  <A>(f: (value: A) => Disposable, effect: PureEffect<A>): Disposable
  <A>(f: (value: A) => Disposable): (effect: PureEffect<A>) => Disposable
} = curry(runEffectUncurried)
