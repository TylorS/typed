import * as Schema from "effect/Schema";

/**
 * Describes a destination before the navigation backend assigns stable entry identity.
 *
 * @remarks
 * ## Why
 * Separating a requested destination from a committed one makes redirects, guards, and backend
 * commits explicit instead of pretending every requested URL is already in history.
 *
 * ## Ownership and lifetime
 * This immutable schema acquires no resources. Values live for as long as the transition or caller
 * retaining them; a navigation provider owns conversion to a committed {@link Destination}.
 *
 * @example
 * ```ts
 * import { ProposedDestination } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * const decode = Schema.decodeUnknownSync(ProposedDestination)
 * const destination = decode({ url: "/settings", state: {}, sameDocument: true })
 * ```
 * @since 1.0.0
 * @category Destination schemas
 */
export const ProposedDestination = Schema.Struct({
  url: Schema.URLFromString,
  state: Schema.Unknown,
  sameDocument: Schema.Boolean,
  key: Schema.optional(Schema.String),
});
/**
 * The decoded TypeScript shape of {@link ProposedDestination}.
 *
 * @remarks
 * ## Why
 * The alias keeps runtime validation and the compile-time transition contract derived from one
 * Effect Schema definition.
 *
 * ## Ownership and lifetime
 * This type acquires no resources and adds no lifetime beyond the value it describes.
 *
 * @since 1.0.0
 * @category Destination schemas
 */
export type ProposedDestination = typeof ProposedDestination.Type;

/**
 * Describes a committed history entry with stable `id` and `key` identity.
 *
 * @remarks
 * ## Why
 * Routers and state stores need identity that survives URL equality: `key` addresses traversal,
 * while `id` distinguishes commits which may otherwise contain the same URL and state.
 *
 * ## Ownership and lifetime
 * This immutable schema acquires no resources. The active navigation provider owns entry creation,
 * retention, serialization, and eviction.
 *
 * @example
 * ```ts
 * import { Destination } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * const decode = Schema.decodeUnknownSync(Destination)
 * ```
 * @since 1.0.0
 * @category Destination schemas
 */
export const Destination = Schema.Struct({
  ...ProposedDestination.fields,
  id: Schema.String,
  key: Schema.String,
});
/**
 * The decoded TypeScript shape of {@link Destination}.
 *
 * @remarks
 * ## Why
 * Deriving the type from the schema prevents browser, memory, and router providers from drifting
 * away from the validated entry representation.
 *
 * ## Ownership and lifetime
 * This type acquires no resources and adds no lifetime beyond the committed entry it describes.
 *
 * @since 1.0.0
 * @category Destination schemas
 */
export type Destination = typeof Destination.Type;

/**
 * Validates the four transition operations understood by navigation providers.
 *
 * @remarks
 * ## Why
 * A closed operation vocabulary lets handlers distinguish history growth, replacement, reload, and
 * traversal without inspecting backend-specific events.
 *
 * ## Ownership and lifetime
 * This immutable schema acquires no resources.
 *
 * @example
 * ```ts
 * import { NavigationType } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * Schema.decodeUnknownSync(NavigationType)("replace")
 * ```
 * @since 1.0.0
 * @category Transition schemas
 */
export const NavigationType = Schema.Union([
  Schema.Literal("push"),
  Schema.Literal("replace"),
  Schema.Literal("reload"),
  Schema.Literal("traverse"),
]);
/**
 * The operation-name union accepted by {@link NavigationType}.
 *
 * @remarks
 * ## Why
 * The alias exposes the schema's precise literal union to transition-aware APIs.
 *
 * ## Ownership and lifetime
 * This type acquires no resources.
 *
 * @since 1.0.0
 * @category Transition schemas
 */
export type NavigationType = typeof NavigationType.Type;

/**
 * Describes the currently proposed navigation before handlers and commit finish.
 *
 * @remarks
 * ## Why
 * Publishing an explicit transition lets renderers expose pending work without confusing it with a
 * post-commit event or prematurely changing the current entry.
 *
 * ## Ownership and lifetime
 * The schema acquires no resources. A navigation service owns the current transition and clears it
 * on commit, cancellation, redirect, failure, or interruption.
 *
 * @example
 * ```ts
 * import { Transition } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * const isTransition = Schema.is(Transition)
 * ```
 * @since 1.0.0
 * @category Transition schemas
 */
export const Transition = Schema.Struct({
  type: NavigationType,
  from: Destination,
  to: ProposedDestination,
  info: Schema.optional(Schema.Unknown),
});
/**
 * The decoded TypeScript shape of {@link Transition}.
 *
 * @remarks
 * ## Why
 * The alias makes pending navigation state available to RefSubject consumers without duplicating
 * its runtime schema.
 *
 * ## Ownership and lifetime
 * This type acquires no resources; the navigation service owns values described by it.
 *
 * @since 1.0.0
 * @category Transition schemas
 */
export type Transition = typeof Transition.Type;

/**
 * Describes the pre-commit event presented to navigation guards.
 *
 * @remarks
 * ## Why
 * Guards need the old and proposed destinations plus traversal delta before a backend mutates
 * history. This event is deliberately distinct from post-commit {@link NavigationEvent}.
 *
 * ## Ownership and lifetime
 * The schema acquires no resources. The navigation operation owns each event until its registered
 * handlers settle; handlers must copy data they need later.
 *
 * @example
 * ```ts
 * import { BeforeNavigationEvent } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * const isBeforeEvent = Schema.is(BeforeNavigationEvent)
 * ```
 * @since 1.0.0
 * @category Navigation event schemas
 */
export const BeforeNavigationEvent = Schema.Struct({
  type: NavigationType,
  from: Destination,
  delta: Schema.Int,
  to: ProposedDestination,
  info: Schema.Unknown,
});
/**
 * The decoded TypeScript shape of {@link BeforeNavigationEvent}.
 *
 * @remarks
 * ## Why
 * The alias gives guard APIs a single backend-neutral input contract.
 *
 * ## Ownership and lifetime
 * This type acquires no resources; a single navigation operation owns each described value.
 *
 * @since 1.0.0
 * @category Navigation event schemas
 */
export type BeforeNavigationEvent = typeof BeforeNavigationEvent.Type;

/**
 * Describes a destination after it has been committed by the navigation backend.
 *
 * @remarks
 * ## Why
 * Post-commit handlers should observe the actual destination, not the earlier proposal, so state
 * synchronization can run only after history and current-entry state agree.
 *
 * ## Ownership and lifetime
 * The schema acquires no resources. The navigation operation owns dispatch; scoped handler
 * registration controls who receives the event.
 *
 * @example
 * ```ts
 * import { NavigationEvent } from "@typed/navigation/model"
 * import * as Schema from "effect/Schema"
 *
 * const isNavigationEvent = Schema.is(NavigationEvent)
 * ```
 * @since 1.0.0
 * @category Navigation event schemas
 */
export const NavigationEvent = Schema.Struct({
  type: NavigationType,
  destination: Destination,
  info: Schema.Unknown,
});
/**
 * The decoded TypeScript shape of {@link NavigationEvent}.
 *
 * @remarks
 * ## Why
 * The alias keeps post-commit handler inputs aligned with their runtime validator.
 *
 * ## Ownership and lifetime
 * This type acquires no resources; the navigation operation owns event dispatch.
 *
 * @since 1.0.0
 * @category Navigation event schemas
 */
export type NavigationEvent = typeof NavigationEvent.Type;

/**
 * Wraps malformed URLs, unknown traversal keys, identifier failures, and backend history failures.
 *
 * @remarks
 * ## Why
 * Providers normalize platform-specific exceptions into one typed Effect error channel while
 * preserving the original value in `error` for diagnosis.
 *
 * ## Ownership and lifetime
 * Constructing the error acquires no resources. The Effect performing navigation owns and
 * propagates it; interruption still runs that Effect's normal finalizers.
 *
 * @since 1.0.0
 * @category Navigation failures
 */
export class NavigationError extends Schema.TaggedError<NavigationError>()(
  `@typed/navigation/NavigationError`,
  {
    error: Schema.Unknown,
  },
) {}

/**
 * Signals that a pre-navigation handler wants to replace the pending destination.
 *
 * @remarks
 * ## Why
 * Redirect is modeled as typed control flow so it composes through Effect causes without committing
 * the rejected destination. The navigation core follows redirects as replacements and rejects
 * cycles after ten hops with {@link NavigationError}.
 *
 * ## Ownership and lifetime
 * Constructing the error acquires no resources. The active navigation Effect consumes it and owns
 * the redirected transition.
 *
 * @since 1.0.0
 * @category Transition control
 */
export class RedirectError extends Schema.TaggedError<RedirectError>()(
  `@typed/navigation/RedirectError`,
  {
    url: Schema.Union([Schema.URLFromString, Schema.String]),
    options: Schema.optional(
      Schema.Struct({
        state: Schema.optional(Schema.Unknown),
        info: Schema.optional(Schema.Unknown),
      }),
    ),
  },
) {}

/**
 * Signals that a pre-navigation handler rejects the pending transition.
 *
 * @remarks
 * ## Why
 * Cancellation is expected navigation control flow, not an untyped exception: the core clears the
 * transition and returns the current committed destination unchanged.
 *
 * ## Ownership and lifetime
 * Constructing the error acquires no resources. The active navigation Effect consumes it before
 * releasing its transition state.
 *
 * @since 1.0.0
 * @category Transition control
 */
export class CancelNavigation extends Schema.TaggedError<CancelNavigation>()(
  `@typed/navigation/CancelNavigation`,
  {},
) {}
