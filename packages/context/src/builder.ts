/**
 * ContextBuilder is a fluent interface for building and managing Contexts
 * @since 1.0.0
 */

import * as C from "@effect/data/Context"

/**
 * ContextBuilder is a fluent interface for building and managing Contexts
 * @since 1.0.0
 */
export interface ContextBuilder<I> {
  readonly context: C.Context<I>
  readonly add: <I2, S>(tag: C.Tag<I2, S>, s: S) => ContextBuilder<I | I2>
  readonly merge: <I2>(builder: ContextBuilder<I2>) => ContextBuilder<I | I2>
  readonly mergeContext: <I2>(context: C.Context<I2>) => ContextBuilder<I | I2>
  readonly pick: <S extends ReadonlyArray<C.ValidTagsById<I>>>(
    ...tags: S
  ) => ContextBuilder<C.Tag.Identifier<S[number]>>
}

/**
 * @since 1.0.0
 */
export namespace ContextBuilder {
  /**
   * An empty ContextBuilder
   * @since 1.0.0
   */
  export const empty: ContextBuilder<never> = fromContext(C.empty())

  /**
   * Create a ContextBuilder from a Context
   * @since 1.0.0
   */
  export function fromContext<I>(context: C.Context<I>): ContextBuilder<I> {
    return {
      context,
      add: <I2, S>(tag: C.Tag<I2, S>, s: S) => fromContext(C.add(context, tag, s)),
      merge: <I2>(builder: ContextBuilder<I2>) => fromContext(C.merge(context, builder.context)),
      mergeContext: <I2>(ctx: C.Context<I2>) => fromContext(C.merge(context, ctx)),
      pick: (...tags) => context.pipe(C.pick(...tags), fromContext)
    }
  }

  /**
   * Create a ContextBuilder from a service.
   * @since 1.0.0
   */
  export function fromTag<I, S>(tag: C.Tag<I, S>, s: S): ContextBuilder<I> {
    return fromContext(C.make(tag, s))
  }
}
