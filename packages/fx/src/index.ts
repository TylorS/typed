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
 * Computed docs: https://tylors.github.io/typed-fp/fx/Computed.ts.html
 * @since 1.18.0
 */
export * as Computed from "./Computed"

/**
 * Filtered docs: https://tylors.github.io/typed-fp/fx/Filtered.ts.html
 * @since 1.18.0
 */
export * as Filtered from "./Filtered"

/**
 * Fx docs: https://tylors.github.io/typed-fp/fx/Fx.ts.html
 * @since 1.18.0
 */
export * from "./Fx"

/**
 * RefArray docs: https://tylors.github.io/typed-fp/fx/RefArray.ts.html
 * @since 1.18.0
 */
export * as RefArray from "./RefArray"

/**
 * RefRemoteData docs: https://tylors.github.io/typed-fp/fx/RefRemoteData.ts.html
 * @since 1.18.0
 */
export * as RefRemoteData from "./RefRemoteData"

/**
 * RefSubject docs: https://tylors.github.io/typed-fp/fx/RefSubject.ts.html
 * @since 1.18.0
 */
export * as RefSubject from "./RefSubject"

/**
 * Sink docs: https://tylors.github.io/typed-fp/fx/Sink.ts.html
 * @since 1.18.0
 */
export * as Sink from "./Sink"

/**
 * Subject docs: https://tylors.github.io/typed-fp/fx/Subject.ts.html
 * @since 1.18.0
 */
export * as Subject from "./Subject"

/**
 * Typeclass docs: https://tylors.github.io/typed-fp/fx/Typeclass.ts.html
 * @since 1.18.0
 */
export * as Typeclass from "./Typeclass"

/**
 * TypeId docs: https://tylors.github.io/typed-fp/fx/TypeId.ts.html
 * @since 1.18.0
 */
export * from "./TypeId"
