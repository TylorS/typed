/**
 * Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
 * the time dimension. It operates within a context `R`, can fail with an `E`,
 * and succeed with an `A`.
 *
 * Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
 * indefinite period of time. This is in contrast to `Effect` which can only
 * produce exactly 1 error or event.
 *
 * It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
 * allows for all operators that accept an `Fx` to also capable of
 * accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
 * event or error, while a Stream represents a series of events or errors that will
 * be pulled from the producer as soon as possible.
 *
 * @since 1.18.0
 */

/**
 * [Computed documentation](https://tylors.github.io/typed/fx/Computed.ts.html)
 * @since 1.18.0
 */
export * as Computed from "./Computed"

/**
 * [Filtered documentation](https://tylors.github.io/typed/fx/Filtered.ts.html)
 * @since 1.18.0
 */
export * as Filtered from "./Filtered"

/**
 * [Fx documentation](https://tylors.github.io/typed/fx/Fx.ts.html)
 * @since 1.18.0
 */
export * from "./Fx"

/**
 * [RefArray documentation](https://tylors.github.io/typed/fx/RefArray.ts.html)
 * @since 1.18.0
 */
export * as RefArray from "./RefArray"

/**
 * [RefRemoteData documentation](https://tylors.github.io/typed/fx/RefRemoteData.ts.html)
 * @since 1.18.0
 */
export * as RefRemoteData from "./RefRemoteData"

/**
 * [RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)
 * @since 1.18.0
 */
export * as RefSubject from "./RefSubject"

/**
 * [Sink documentation](https://tylors.github.io/typed/fx/Sink.ts.html)
 * @since 1.18.0
 */
export * as Sink from "./Sink"

/**
 * [Subject documentation](https://tylors.github.io/typed/fx/Subject.ts.html)
 * @since 1.18.0
 */
export * as Subject from "./Subject"

/**
 * [Typeclass documentation](https://tylors.github.io/typed/fx/Typeclass.ts.html)
 * @since 1.18.0
 */
export * as Typeclass from "./Typeclass"

/**
 * [TypeId documentation](https://tylors.github.io/typed/fx/TypeId.ts.html)
 * @since 1.18.0
 */
export * from "./TypeId"
