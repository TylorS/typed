import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import { EffectFn, Fn } from './fn.js'
import { IdentifierOf } from './identifier.js'

export function FnClass<A extends EffectFn<readonly any[]>>() {
  return class FnImpl {
    readonly __EffectFn__!: A

    static get _id() {
      return Symbol.for(this.name)
    }

    get _id() {
      return (this.constructor as any)._id
    }

    static withEffect: <T extends typeof FnImpl, R, E, B>(
      this: T,
      f: (fn: A) => Effect.Effect<R, E, B>,
    ) => Effect.Effect<
      InstanceType<T> | EffectFn.ResourcesOf<A>,
      EffectFn.ErrorsOf<A>,
      EffectFn.OutputOf<A>
    >

    static apply: <T extends typeof FnImpl, Args extends EffectFn.ArgsOf<A>>(
      this: T,
      ...args: Args
    ) => Effect.Effect<
      InstanceType<T> | EffectFn.ResourcesOf<A>,
      EffectFn.ErrorsOf<A>,
      EffectFn.OutputOf<A>
    >

    static implement: <T extends typeof FnImpl, F extends EffectFn.Extendable<A>>(
      this: T,
      f: F,
    ) => Layer.Layer<EffectFn.ResourcesOf<A>, never, IdentifierOf<T>>

    static provideImplementation: {
      <T extends typeof FnImpl, F extends EffectFn.Extendable<A>>(
        this: T,
        f: F,
      ): <R, E, B>(
        effect: Effect.Effect<R, E, B>,
      ) => Effect.Effect<
        Exclude<R, IdentifierOf<T>> | EffectFn.ResourcesOf<A>,
        E | EffectFn.ErrorsOf<A>,
        B
      >

      <T extends typeof FnImpl, R, E, B, F extends EffectFn.Extendable<A>>(
        this: T,
        effect: Effect.Effect<R, E, B>,
        f: F,
      ): Effect.Effect<
        Exclude<R, IdentifierOf<T>> | EffectFn.ResourcesOf<A>,
        E | EffectFn.ErrorsOf<A>,
        B
      >
    }

    static {
      Object.assign(this, Fn<A>()(this))
    }
  }
}
