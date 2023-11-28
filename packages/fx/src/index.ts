/**
 * Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
 * the time dimension. It operates within a context `R`, can fail with an `E`,
 * and succeed with an `A`.
 *
 * Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
 * indefinite period of time. This is in contrast to `Effect` which can only
 * produce exactly 1 error or event.
 * @since 1.18.0
 */

/**
 * [Computed documentation](https://tylors.github.io/typed/fx/Computed.ts.html)
 * @since 1.18.0
 */
export * as Computed from "./Computed.js"

/**
 * [Filtered documentation](https://tylors.github.io/typed/fx/Filtered.ts.html)
 * @since 1.18.0
 */
export * as Filtered from "./Filtered.js"

/**
 * [Fx documentation](https://tylors.github.io/typed/fx/Fx.ts.html)
 * @since 1.18.0
 */
export * from "./Fx.js"

/**
 * [RefArray documentation](https://tylors.github.io/typed/fx/RefArray.ts.html)
 * @since 1.18.0
 */
export * as RefArray from "./RefArray.js"

/**
 * [RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)
 * @since 1.18.0
 */
export * as RefSubject from "./RefSubject.js"

/**
 * [Sink documentation](https://tylors.github.io/typed/fx/Sink.ts.html)
 * @since 1.18.0
 */
export * as Sink from "./Sink.js"

/**
 * [Subject documentation](https://tylors.github.io/typed/fx/Subject.ts.html)
 * @since 1.18.0
 */
export * as Subject from "./Subject.js"

/**
 * [Typeclass documentation](https://tylors.github.io/typed/fx/Typeclass.ts.html)
 * @since 1.18.0
 */
export * as Typeclass from "./Typeclass.js"

/**
 * [TypeId documentation](https://tylors.github.io/typed/fx/TypeId.ts.html)
 * @since 1.18.0
 */
export * from "./TypeId.js"
