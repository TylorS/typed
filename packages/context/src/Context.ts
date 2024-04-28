/**
 * Re-exports from @effect/data/Context
 * @since 1.0.0
 */

import { get, isContext } from "effect/Context"
import type { Context, Tag, ValidTagsById } from "effect/Context"
import { dual } from "effect/Function"

export {
  /**
   * Adds a service to a given `Context`.
   *
   * @example
   * import * as Context from "effect/Context"
   * import { pipe } from "effect/Function"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const someContext = Context.make(Port, { PORT: 8080 })
   *
   * const Services = pipe(
   *   someContext,
   *   Context.add(Timeout, { TIMEOUT: 5000 })
   * )
   *
   * assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
   * assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
   *
   * @since 1.0.0
   */
  add,
  /**
   * @since 1.0.0
   * @category models
   */
  type Context,
  /**
   * Returns an empty `Context`.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * assert.strictEqual(Context.isContext(Context.empty()), true)
   *
   * @since 1.0.0
   * @category constructors
   */
  empty,
  /**
   * Get a service from the context that corresponds to the given tag.
   *
   * @param self - The `Context` to search for the service.
   * @param tag - The `Tag` of the service to retrieve.
   *
   * @example
   * import * as Context from "effect/Context"
   * import { pipe } from "effect/Function"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const Services = pipe(
   *   Context.make(Port, { PORT: 8080 }),
   *   Context.add(Timeout, { TIMEOUT: 5000 })
   * )
   *
   * assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
   *
   * @since 1.0.0
   * @category getters
   */
  get,
  /**
   * Get the value associated with the specified tag from the context wrapped in an `Option` object. If the tag is not
   * found, the `Option` object will be `None`.
   *
   * @param self - The `Context` to search for the service.
   * @param tag - The `Tag` of the service to retrieve.
   *
   * @example
   * import * as Context from "effect/Context"
   * import * as O from "effect/Option"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const Services = Context.make(Port, { PORT: 8080 })
   *
   * assert.deepStrictEqual(Context.getOption(Services, Port), O.some({ PORT: 8080 }))
   * assert.deepStrictEqual(Context.getOption(Services, Timeout), O.none())
   *
   * @since 1.0.0
   * @category getters
   */
  getOption,
  /**
   * Returns an empty `Context`.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * assert.strictEqual(Context.isContext(Context.empty()), true)
   *
   * @since 1.0.0
   * @category constructors
   */
  isContext,
  /**
   * Checks if the provided argument is a `Tag`.
   *
   * @param input - The value to be checked if it is a `Tag`.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * assert.strictEqual(Context.isTag(Context.Tag()), true)
   *
   * @since 1.0.0
   * @category guards
   */
  isTag,
  /**
   * Creates a new `Context` with a single service associated to the tag.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   *
   * const Services = Context.make(Port, { PORT: 8080 })
   *
   * assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
   *
   * @since 1.0.0
   * @category constructors
   */
  make,
  /**
   * Merges two `Context`s, returning a new `Context` containing the services of both.
   *
   * @param self - The first `Context` to merge.
   * @param that - The second `Context` to merge.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const firstContext = Context.make(Port, { PORT: 8080 })
   * const secondContext = Context.make(Timeout, { TIMEOUT: 5000 })
   *
   * const Services = Context.merge(firstContext, secondContext)
   *
   * assert.deepStrictEqual(Context.get(Services, Port), { PORT: 8080 })
   * assert.deepStrictEqual(Context.get(Services, Timeout), { TIMEOUT: 5000 })
   *
   * @since 1.0.0
   */
  merge,
  /**
   * Omits specified services from a given `Context`.
   * @since 1.0.0
   */
  omit,
  /**
   * Returns a new `Context` that contains only the specified services.
   *
   * @param self - The `Context` to prune services from.
   * @param tags - The list of `Tag`s to be included in the new `Context`.
   *
   * @example
   * import * as Context from "effect/Context"
   * import { pipe } from "effect/Function"
   * import * as O from "effect/Option"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const someContext = pipe(
   *   Context.make(Port, { PORT: 8080 }),
   *   Context.add(Timeout, { TIMEOUT: 5000 })
   * )
   *
   * const Services = pipe(someContext, Context.pick(Port))
   *
   * assert.deepStrictEqual(Context.getOption(Services, Port), O.some({ PORT: 8080 }))
   * assert.deepStrictEqual(Context.getOption(Services, Timeout), O.none())
   *
   * @since 1.0.0
   */
  pick,
  /**
   * @since 1.0.0
   */
  type TagClass,
  /**
   * @since 1.0.0
   * @category symbol
   */
  type TagTypeId,
  /**
   * @category models
   * @since 1.0.0
   */
  type TagUnify,
  /**
   * @category models
   * @since 1.0.0
   */
  type TagUnifyIgnore,
  /**
   * @category symbol
   * @since 1.0.0
   */
  type TypeId,
  /**
   * Get a service from the context that corresponds to the given tag.
   * This function is unsafe because if the tag is not present in the context, a runtime error will be thrown.
   *
   * For a safer version see {@link getOption}.
   *
   * @param self - The `Context` to search for the service.
   * @param tag - The `Tag` of the service to retrieve.
   *
   * @example
   * import * as Context from "effect/Context"
   *
   * const Port = Context.Tag<{ PORT: number }>()
   * const Timeout = Context.Tag<{ TIMEOUT: number }>()
   *
   * const Services = Context.make(Port, { PORT: 8080 })
   *
   * assert.deepStrictEqual(Context.unsafeGet(Services, Port), { PORT: 8080 })
   * assert.throws(() => Context.unsafeGet(Services, Timeout))
   *
   * @since 1.0.0
   * @category unsafe
   */
  unsafeGet,
  /**
   * @since 1.0.0
   * @category models
   */
  type ValidTagsById
} from "effect/Context"

/**
 * Get multiple services from the context that corresponds to the given tags.
 * @since 1.0.0
 */
export const getMany: {
  <Services, T extends ReadonlyArray<ValidTagsById<Services>>>(
    ...tags: T
  ): (self: Context<Services>) => { readonly [K in keyof T]: Tag.Service<T[K]> }
  <Services, T extends ReadonlyArray<ValidTagsById<Services>>>(
    self: Context<Services>,
    ...tags: T
  ): { readonly [K in keyof T]: Tag.Service<T[K]> }
} = dual((args) => isContext(args[0]), (self, ...tags) => tags.map((t) => get(self, t)))
