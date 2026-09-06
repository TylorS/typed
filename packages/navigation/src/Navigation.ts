import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { RefSubject } from "@typed/fx";
import type {
  BeforeNavigationEvent,
  CancelNavigation,
  Destination,
  NavigationError,
  NavigationEvent,
  RedirectError,
  Transition,
} from "./model.js";

/**
 * Configures a push or replacement navigation and carries application state and handler metadata.
 *
 * @remarks
 * ## Why
 * Navigation state belongs to the committed entry, while `info` is transient coordination data for
 * handlers. `history: "auto"` replaces when origin and pathname match, so query/hash-only changes
 * do not grow history.
 *
 * ## Ownership and lifetime
 * This immutable options object acquires no resources. The navigation Effect retains it only for
 * the transition; providers retain `state` only if the destination commits.
 *
 * @since 1.0.0
 * @category Command options
 */
export interface NavigationNavigateOptions {
  /**
   * Application state stored with a committed destination.
   *
   * @remarks
   * ## Why
   * Persistent entry data stays distinct from transient handler information.
   *
   * ## Ownership and lifetime
   * The caller owns the supplied state value. A successful commit retains it on the resulting Destination; a cancelled or failed transition does not.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly state?: unknown;
  /**
   * Transient metadata delivered to navigation handlers.
   *
   * @remarks
   * ## Why
   * Coordination data can accompany a transition without being serialized as entry state.
   *
   * ## Ownership and lifetime
   * The transition retains this metadata only until post-commit handlers finish; it is not stored on the Destination history entry.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly info?: unknown;
  /**
   * Selects automatic, push, or replace history placement.
   *
   * @remarks
   * ## Why
   * Automatic placement replaces same-origin, same-pathname changes so query or hash updates do not grow history.
   *
   * ## Ownership and lifetime
   * The navigation Effect reads this mode for one transition and does not retain the options object after completion.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly history?: "auto" | "push" | "replace";
}

/**
 * Configures a reload while optionally replacing the current entry state.
 *
 * @remarks
 * ## Why
 * Reload has no history-placement choice but still needs the same state and handler metadata
 * channels as other transitions.
 *
 * ## Ownership and lifetime
 * This immutable options object acquires no resources and is retained only for the reload Effect.
 *
 * @since 1.0.0
 * @category Command options
 */
export interface NavigationReloadOptions {
  /**
   * Application state stored with a committed destination.
   *
   * @remarks
   * ## Why
   * Persistent entry data stays distinct from transient handler information.
   *
   * ## Ownership and lifetime
   * The caller owns the supplied state value. A successful commit retains it on the resulting Destination; a cancelled or failed transition does not.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly state?: unknown;
  /**
   * Transient metadata delivered to navigation handlers.
   *
   * @remarks
   * ## Why
   * Coordination data can accompany a transition without being serialized as entry state.
   *
   * ## Ownership and lifetime
   * The transition retains this metadata only until post-commit handlers finish; it is not stored on the Destination history entry.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly info?: unknown;
}

/**
 * Adds transient handler metadata to back, forward, and keyed traversal operations.
 *
 * @remarks
 * ## Why
 * Traversal preserves destination state and identity, so only non-persistent coordination data is
 * configurable.
 *
 * ## Ownership and lifetime
 * This immutable options object acquires no resources and is retained only for the traversal.
 *
 * @since 1.0.0
 * @category Command options
 */
export interface NavigationInfoOptions {
  /**
   * Transient metadata delivered to navigation handlers.
   *
   * @remarks
   * ## Why
   * Coordination data can accompany a transition without being serialized as entry state.
   *
   * ## Ownership and lifetime
   * The transition retains this metadata only until post-commit handlers finish; it is not stored on the Destination history entry.
   *
   * @since 1.0.0
   * @category Command options
   */
  readonly info?: unknown;
}

type DestinationState<S> = Omit<Destination, "state"> & {
  readonly state: S;
};

/**
 * Provides backend-neutral reactive navigation state and Effectful history operations.
 *
 * @remarks
 * ## Why
 * Routers, renderers, and application code can depend on one service whether history comes from a
 * browser, SSR memory, or a test. Current entry, entries, and transition are RefSubjects so state
 * remains renderer-independent.
 *
 * ## Ownership and lifetime
 * A provider Layer owns the service, its backend listeners, reactive state, and handler registry.
 * Handler registration requires a Scope and unregisters through that scope's finalizer. Each
 * navigation Effect publishes a transition, runs before handlers sequentially, commits, clears the
 * transition, and then runs post-commit handlers. Interruption follows Effect's scoped cleanup.
 *
 * @example
 * ```ts
 * import { Navigation } from "@typed/navigation/Navigation"
 * import * as Effect from "effect/Effect"
 *
 * const goToAccount = Navigation.navigate("/account", { history: "push" })
 * const current = Navigation.currentEntry
 * ```
 *
 * Effect service and Scope concepts follow the Effect v4 model documented at
 * https://effect.website/docs/requirements-management/services/ and
 * https://effect.website/docs/resource-management/scope/.
 *
 * @since 1.0.0
 * @category Navigation service
 */
export class Navigation extends Context.Service<
  Navigation,
  {
    readonly origin: string;
    readonly base: string;
    readonly currentEntry: RefSubject.Computed<Destination>;
    readonly entries: RefSubject.Computed<ReadonlyArray<Destination>>;
    readonly transition: RefSubject.Filtered<Transition>;
    readonly canGoBack: RefSubject.Computed<boolean>;
    readonly canGoForward: RefSubject.Computed<boolean>;

    readonly navigate: (
      url: string | URL,
      options?: NavigationNavigateOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly back: (options?: NavigationInfoOptions) => Effect.Effect<Destination, NavigationError>;
    readonly forward: (
      options?: NavigationInfoOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly traverseTo: (
      key: Destination["key"],
      options?: NavigationInfoOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly updateCurrentEntry: (options: {
      readonly state: unknown;
    }) => Effect.Effect<Destination, NavigationError>;
    readonly reload: (
      options?: NavigationReloadOptions,
    ) => Effect.Effect<Destination, NavigationError>;

    readonly onBeforeNavigation: <R = never, R2 = never>(
      handler: BeforeNavigationHandler<R, R2>,
    ) => Effect.Effect<void, never, R | R2 | Scope.Scope>;
    readonly onNavigation: <R = never, R2 = never>(
      handler: NavigationHandler<R, R2>,
    ) => Effect.Effect<void, never, R | R2 | Scope.Scope>;
  }
>()("@typed/navigation/Navigation") {
  /**
   * The absolute origin used to resolve relative destinations.
   *
   * @remarks
   * ## Why
   * A single origin makes same-document classification and URL normalization consistent across providers.
   *
   * ## Ownership and lifetime
   * `Navigation.origin` reads the active service synchronously; the provider owns the stored string for its Layer lifetime.
   *
   * @since 1.0.0
   * @category Current destination
   */
  static readonly origin = Navigation.useSync((n) => n.origin);
  /**
   * The structural base path exposed by the active provider.
   *
   * @remarks
   * ## Why
   * Routers can establish a stable mount root separately from the changing current URL.
   *
   * ## Ownership and lifetime
   * `Navigation.base` reads the active service synchronously; the provider owns the stored string for its Layer lifetime.
   *
   * @since 1.0.0
   * @category Current destination
   */
  static readonly base = Navigation.useSync((n) => n.base);

  /**
   * The reactive committed destination at the active history index.
   *
   * @remarks
   * ## Why
   * Readers observe committed history. A before-navigation decision can still cancel or redirect
   * the separate proposed transition without changing this value. A committed destination does
   * not imply that the selected page has finished loading data or mounting its DOM.
   *
   * ## Ownership and lifetime
   * `Navigation.currentEntry` is a provider-backed RefSubject view. The provider owns its state; each consumer Scope owns and releases its observation.
   *
   * @since 1.0.0
   * @category Current destination
   */
  static readonly currentEntry = RefSubject.computedFromService(
    Navigation.useSync((n) => n.currentEntry),
  );
  /**
   * The reactive retained history entries in traversal order.
   *
   * @remarks
   * ## Why
   * Back, forward, and keyed traversal need an explicit bounded history model in every provider.
   *
   * ## Ownership and lifetime
   * `Navigation.entries` is a provider-backed RefSubject view. The provider owns its state; each consumer Scope owns and releases its observation.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly entries = RefSubject.computedFromService(Navigation.useSync((n) => n.entries));
  /**
   * The reactive transition while navigation is pending.
   *
   * @remarks
   * ## Why
   * Renderers can show pending work without treating a proposal as the committed destination.
   *
   * ## Ownership and lifetime
   * `Navigation.transition` is a provider-backed RefSubject view. The provider owns its state; each consumer Scope owns and releases its observation.
   *
   * Use `transition.asComputed()` when pending UI must observe `Option.none()` as the transition
   * ends. The Filtered observation itself emits only present transitions, so it cannot signal
   * absence by publishing another Transition. Reading it while absent has the usual Filtered
   * `NoSuchElementError` behavior.
   *
   * @since 1.0.0
   * @category Destination transitions
   */
  static readonly transition = RefSubject.filteredFromService(
    Navigation.useSync((n) => n.transition),
  );
  /**
   * Whether the retained history contains a preceding entry.
   *
   * @remarks
   * ## Why
   * Callers can disable back actions without duplicating provider bounds logic.
   *
   * ## Ownership and lifetime
   * `Navigation.canGoBack` is a provider-backed RefSubject view. The provider owns its state; each consumer Scope owns and releases its observation.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly canGoBack = RefSubject.computedFromService(
    Navigation.useSync((n) => n.canGoBack),
  );
  /**
   * Whether the retained history contains a following entry.
   *
   * @remarks
   * ## Why
   * Callers can disable forward actions after pushes truncate the forward branch.
   *
   * ## Ownership and lifetime
   * `Navigation.canGoForward` is a provider-backed RefSubject view. The provider owns its state; each consumer Scope owns and releases its observation.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly canGoForward = RefSubject.computedFromService(
    Navigation.useSync((n) => n.canGoForward),
  );

  /**
   * Starts a push or replacement transition to a URL.
   *
   * @remarks
   * ## Why
   * All backends use the same ordered guard, redirect, commit, and post-commit protocol.
   *
   * ## Ownership and lifetime
   * The provider owns the proposed transition until it commits, redirects, cancels, fails, or is
   * interrupted. Once its backend mutation commits, later interruption cannot undo that mutation.
   *
   * @since 1.0.0
   * @category Destination transitions
   */
  static navigate<S>(
    url: string | URL,
    options: NavigationNavigateOptions & { readonly state: S },
  ): Effect.Effect<DestinationState<S>, NavigationError, Navigation>;
  static navigate(
    url: string | URL,
    options?: NavigationNavigateOptions,
  ): Effect.Effect<Destination, NavigationError, Navigation>;
  static navigate(url: string | URL, options?: NavigationNavigateOptions) {
    return Navigation.use((n) => n.navigate(url, options));
  }

  /**
   * Traverses to the preceding retained entry when one exists.
   *
   * @remarks
   * ## Why
   * Bounds behavior stays provider-neutral and preserves the destination's key, id, and state.
   *
   * ## Ownership and lifetime
   * The provider computes the preceding index and owns the resulting traversal transition. At the
   * lower bound it returns the current Destination without creating backend work.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly back = (options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.back(options));
  /**
   * Traverses to the following retained entry when one exists.
   *
   * @remarks
   * ## Why
   * Bounds behavior stays provider-neutral and preserves forward-history identity.
   *
   * ## Ownership and lifetime
   * The provider computes the following index and owns the resulting traversal transition. At the
   * upper bound it returns the current Destination without creating backend work.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly forward = (options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.forward(options));
  /**
   * Traverses to a retained entry by stable key.
   *
   * @remarks
   * ## Why
   * A key addresses history identity even when several entries share the same URL.
   *
   * ## Ownership and lifetime
   * The provider owns keyed lookup and the resulting backend traversal. The current key is a no-op;
   * an unknown key fails with `NavigationError` before any backend commit.
   *
   * @since 1.0.0
   * @category History traversal
   */
  static readonly traverseTo = (key: Destination["key"], options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.traverseTo(key, options));

  /**
   * Replaces application state on the current committed entry.
   *
   * @remarks
   * ## Why
   * State updates should not create a new navigation position or remount the selected route.
   *
   * ## Ownership and lifetime
   * The provider owns the replacement transition and retains the supplied state only if it commits.
   * The existing Destination key and history position remain current.
   *
   * @since 1.0.0
   * @category Entry state
   */
  static updateCurrentEntry<S>(options: {
    readonly state: S;
  }): Effect.Effect<DestinationState<S>, NavigationError, Navigation>;
  static updateCurrentEntry(options: {
    readonly state: unknown;
  }): Effect.Effect<Destination, NavigationError, Navigation>;
  static updateCurrentEntry(options: { readonly state: unknown }) {
    return Navigation.use((n) => n.updateCurrentEntry(options));
  }

  /**
   * Reloads the current destination through the active backend.
   *
   * @remarks
   * ## Why
   * Reload behavior remains explicit without pretending it is a push or keyed traversal.
   *
   * ## Ownership and lifetime
   * The active provider owns reload work and decides whether the platform can remain in-process.
   * Browser reload may leave the current JavaScript lifetime once the History API action commits.
   *
   * @since 1.0.0
   * @category Destination transitions
   */
  static reload<S>(
    options: NavigationReloadOptions & { readonly state: S },
  ): Effect.Effect<DestinationState<S>, NavigationError, Navigation>;
  static reload(
    options?: NavigationReloadOptions,
  ): Effect.Effect<Destination, NavigationError, Navigation>;
  static reload(options?: NavigationReloadOptions) {
    return Navigation.use((n) => n.reload(options));
  }

  /**
   * Registers a scoped pre-commit navigation handler.
   *
   * @remarks
   * ## Why
   * Handlers can allow, redirect, or cancel before the backend mutates history.
   *
   * ## Ownership and lifetime
   * Registration captures the current Effect context and requires Scope. Closing that Scope unregisters the handler and releases retained references.
   *
   * @since 1.0.0
   * @category Navigation hooks
   */
  static readonly onBeforeNavigation = <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>,
  ) => Navigation.use((n) => n.onBeforeNavigation(handler));
  /**
   * Registers a scoped post-commit navigation handler.
   *
   * @remarks
   * ## Why
   * Follow-up synchronization runs only after history and current-entry state agree.
   *
   * ## Ownership and lifetime
   * Registration captures the current Effect context and requires Scope. Closing that Scope unregisters the handler and releases retained references.
   *
   * @since 1.0.0
   * @category Navigation hooks
   */
  static readonly onNavigation = <R = never, R2 = never>(handler: NavigationHandler<R, R2>) =>
    Navigation.use((n) => n.onNavigation(handler));
}

/**
 * Selects optional pre-commit work for a navigation event.
 *
 * @remarks
 * ## Why
 * The outer Effect decides whether a handler participates; the selected inner Effect can redirect
 * or cancel. This preserves declaration order and separates cheap selection from retained work.
 *
 * ## Ownership and lifetime
 * Registration captures the handler's Effect context and is owned by its Scope. The active
 * transition runs selected effects sequentially and interruption releases normal Effect resources.
 *
 * @since 1.0.0
 * @category Navigation hooks
 */
export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent,
) => Effect.Effect<
  Option.Option<Effect.Effect<unknown, RedirectError | CancelNavigation, R2>>,
  RedirectError | CancelNavigation,
  R
>;

/**
 * Selects optional post-commit work for a committed navigation event.
 *
 * @remarks
 * ## Why
 * Applications can update route-dependent state after history and `currentEntry` agree without
 * making every subscriber run for every event.
 *
 * ## Ownership and lifetime
 * Registration captures the handler's Effect context and is owned by its Scope. Selected follow-up
 * effects run after commit and do not alter the already committed destination.
 *
 * @since 1.0.0
 * @category Navigation hooks
 */
export type NavigationHandler<R, R2> = (
  event: NavigationEvent,
) => Effect.Effect<Option.Option<Effect.Effect<unknown, never, R2>>, never, R>;

/**
 * Reactively exposes the current pathname and search string, excluding origin and hash.
 *
 * @remarks
 * ## Why
 * Router matching needs a stable backend-neutral location source while leaving browser-only URL
 * details to the provider.
 *
 * ## Ownership and lifetime
 * This computed RefSubject acquires no independent listener. It borrows the active Navigation
 * service and lives for the consuming Effect's subscription.
 *
 * @example
 * ```ts
 * import { CurrentPath } from "@typed/navigation/Navigation"
 * import * as Effect from "effect/Effect"
 *
 * const readPath = Effect.map(CurrentPath, (path) => path)
 * ```
 * @since 1.0.0
 * @category Current destination
 */
export const CurrentPath = RefSubject.computedFromService(
  Navigation.useSync((n) =>
    n.currentEntry.pipe(
      RefSubject.map((entry: Destination) => entry.url.pathname + entry.url.search),
    ),
  ),
);
