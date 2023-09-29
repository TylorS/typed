/**
 * ContextBuilder is a fluent interface for building and managing Contexts
 * @since 1.0.0
 */

import * as C from "effect/Context"

/**
 * ContextBuilder is a fluent interface for building and managing Contexts
 * @since 1.0.0
 * @category models
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

function fromContext<I>(context: C.Context<I>): ContextBuilder<I> {
  return {
    context,
    add: <I2, S>(tag: C.Tag<I2, S>, s: S) => fromContext(C.add(context, tag, s)),
    merge: <I2>(builder: ContextBuilder<I2>) => fromContext(C.merge(context, builder.context)),
    mergeContext: <I2>(ctx: C.Context<I2>) => fromContext(C.merge(context, ctx)),
    pick: (...tags) => context.pipe(C.pick(...tags), fromContext)
  }
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const ContextBuilder: {
  /**
   * An empty ContextBuilder
   * @since 1.0.0
   */
  readonly empty: ContextBuilder<never>
  /**
   * Create a ContextBuilder from a Context
   * @since 1.0.0
   */
  readonly fromContext: <I>(context: C.Context<I>) => ContextBuilder<I>
  /**
   * Create a ContextBuilder from a service.
   * @since 1.0.0
   */
  readonly fromTag: <I, S>(tag: C.Tag<I, S>, s: S) => ContextBuilder<I>
} = {
  /**
   * An empty ContextBuilder
   * @since 1.0.0
   */
  empty: fromContext(C.empty()),
  /**
   * Create a ContextBuilder from a Context
   * @since 1.0.0
   */
  fromContext,
  /**
   * Create a ContextBuilder from a service.
   * @since 1.0.0
   */
  fromTag: function fromTag<I, S>(tag: C.Tag<I, S>, s: S): ContextBuilder<I> {
    return ContextBuilder.fromContext(C.make(tag, s))
  }
} as const
