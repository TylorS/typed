import { Uuid7State, uuid7 } from "@typed/id/Uuid7";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { RefSubject } from "@typed/fx";
import { getUrl, makeNavigationCore, type NavigationState } from "./_core.js";
import type { BeforeNavigationEvent, Destination, ProposedDestination } from "./model.js";
import { NavigationError } from "./model.js";
import { Navigation } from "./Navigation.js";

/**
 * Configures an in-memory navigation provider from already committed entries.
 *
 * @remarks
 * ## Why
 * SSR, tests, and non-browser runtimes need deterministic history without emulating `window`.
 * `maxEntries` bounds retained history; pushing after traversal truncates forward entries. `entries`
 * must be non-empty, `maxEntries` must be greater than zero, and `currentIndex` must address an entry
 * that survives the initial tail-retention transform. When `entries.length > maxEntries`, that means
 * `currentIndex >= entries.length - maxEntries`. The provider currently trusts these invariants:
 * violating them can produce a negative transformed index and an undefined `currentEntry`. Despite
 * its name, `maxEntries: 0` currently retains every entry because `slice(-0)` is `slice(0)`. Prefer
 * {@link initialMemory} when starting from a URL rather than a prebuilt history snapshot.
 *
 * ## Ownership and lifetime
 * The Layer retains the supplied `entries` array as its initial snapshot; it does not clone it.
 * Callers must treat that array and its destinations as immutable. Later transitions install new
 * arrays in the provider RefSubject. A custom `commit` function is retained for the service lifetime.
 *
 * @since 1.0.0
 * @category Memory history configuration
 */
export interface MemoryOptions {
  /**
   * The initial committed history snapshot in traversal order.
   *
   * @remarks
   * ## Why
   * Back, forward, and keyed traversal need an explicit history model before retention is applied.
   *
   * ## Ownership and lifetime
   * The Layer retains this array by reference as the first history snapshot. Do not mutate it after
   * Layer acquisition; later provider updates replace the array rather than taking ownership of caller mutation.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly entries: ReadonlyArray<Destination>;
  /**
   * The absolute origin used to resolve relative destinations.
   *
   * @remarks
   * ## Why
   * A single origin makes same-document classification and URL normalization consistent across providers.
   *
   * ## Ownership and lifetime
   * The string is read when the Layer is acquired and retained on the Navigation service.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly origin?: string | undefined;
  /**
   * The structural base path exposed by the active provider.
   *
   * @remarks
   * ## Why
   * Routers can establish a stable mount root separately from the changing current URL.
   *
   * ## Ownership and lifetime
   * The string is read when the Layer is acquired and retained on the Navigation service.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly base?: string | undefined;
  /**
   * The zero-based active position before initial tail retention.
   *
   * @remarks
   * ## Why
   * SSR snapshots and tests can restore traversal position instead of assuming the last entry, but
   * the selected entry must remain inside the retained tail.
   *
   * ## Ownership and lifetime
   * The index is read during Layer acquisition. It must address `entries` and, when
   * `entries.length > maxEntries`, satisfy `currentIndex >= entries.length - maxEntries`. The
   * retention transform subtracts the evicted prefix length; violating this precondition produces a
   * negative index and leaves `currentEntry` undefined. No runtime validation is currently performed.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly currentIndex?: number | undefined;
  /**
   * The positive maximum number of history entries retained by the provider.
   *
   * @remarks
   * ## Why
   * A positive bound makes eviction deterministic: the provider keeps the newest tail and adjusts
   * the active index by the number of evicted entries.
   *
   * ## Ownership and lifetime
   * The number is captured by the RefSubject transformation for the Navigation service lifetime and
   * must be greater than zero. No validation enforces that contract. `0` currently retains all
   * entries because JavaScript evaluates `slice(-0)` as `slice(0)`; it is not a zero-capacity mode.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly maxEntries?: number | undefined;

  /**
   * The backend hook that commits a prepared memory transition.
   *
   * @remarks
   * ## Why
   * Advanced providers can preserve the shared state machine while controlling persistence and handler timing.
   *
   * ## Ownership and lifetime
   * The provider retains the function for its service lifetime and invokes its returned Effect once
   * per commit. Resources acquired by that Effect follow the active navigation fiber and its Scope.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly commit?: (
    before: BeforeNavigationEvent,
    runHandlers: (destination: Destination) => Effect.Effect<void>,
  ) => Effect.Effect<Destination, NavigationError>;
}

/**
 * Configures an in-memory provider from one initial URL.
 *
 * @remarks
 * ## Why
 * Most SSR and tests begin from one location and should not manufacture destination identity by
 * hand; this form creates its key and id through `Uuid7State`.
 *
 * ## Ownership and lifetime
 * The resulting Layer allocates one initial entry and delegates ownership to {@link memory} for the
 * lifetime of the provided Navigation service.
 *
 * @since 1.0.0
 * @category Memory history configuration
 */
export interface InitialMemoryOptions {
  /**
   * The initial URL or path for a one-entry memory provider.
   *
   * @remarks
   * ## Why
   * Callers can start SSR or tests without constructing destination identity manually.
   *
   * ## Ownership and lifetime
   * Layer acquisition resolves this value and stores the resulting URL object on the initial Destination.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly url: string | URL;
  /**
   * The absolute origin used to resolve relative destinations.
   *
   * @remarks
   * ## Why
   * A single origin makes same-document classification and URL normalization consistent across providers.
   *
   * ## Ownership and lifetime
   * The string is read during acquisition and retained on the Navigation service.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly origin?: string | undefined;
  /**
   * The structural base path exposed by the active provider.
   *
   * @remarks
   * ## Why
   * Routers can establish a stable mount root separately from the changing current URL.
   *
   * ## Ownership and lifetime
   * The string is read during acquisition and retained on the Navigation service.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly base?: string | undefined;
  /**
   * The positive maximum number of history entries retained by the provider.
   *
   * @remarks
   * ## Why
   * A positive bound makes eviction deterministic while the one generated initial entry always
   * remains inside the retained tail.
   *
   * ## Ownership and lifetime
   * The number is forwarded to {@link memory} and must be greater than zero. No validation enforces
   * that contract. `0` currently retains all entries because `slice(-0)` is `slice(0)`, so it does
   * not disable history retention.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly maxEntries?: number | undefined;
  /**
   * Application state stored with a committed destination.
   *
   * @remarks
   * ## Why
   * Persistent entry data stays distinct from transient handler information.
   *
   * ## Ownership and lifetime
   * The value is retained by reference on the initial Destination. Callers own any mutable object
   * placed here and should replace rather than mutate it when deterministic history snapshots matter.
   *
   * @since 1.0.0
   * @category Memory history configuration
   */
  readonly state?: unknown;
}

const DEFAULT_MAX_ENTRIES = 50;

const limitEntries =
  (maxEntries: number) =>
  (state: NavigationState): NavigationState => {
    if (state.entries.length <= maxEntries) return state;
    const entries = state.entries.slice(-maxEntries);
    const index = state.index - (state.entries.length - entries.length);
    return { entries, index, transition: state.transition };
  };

/**
 * Provides Navigation from an in-memory history state.
 *
 * @remarks
 * ## Why
 * The same Router and application code can run during SSR or tests without browser globals. Back and
 * forward are bounded, `traverseTo` uses stable entry keys, and history retention is deterministic.
 * This constructor expects at least one entry, a positive `maxEntries`, and an active index that
 * survives tail retention. If truncation is needed, the active entry must lie in the newest
 * `maxEntries` entries; equivalently, `currentIndex >= entries.length - maxEntries`. These
 * preconditions are not validated. `maxEntries: 0` currently behaves as unbounded retention rather
 * than zero capacity. Use `initialMemory` for the common one-URL case.
 *
 * ## Ownership and lifetime
 * Layer acquisition creates the navigation state and handler registries; Layer release finalizes
 * their Scope. The Layer requires `Uuid7State` for newly committed destinations and fails with
 * `NavigationError` when identifier generation or a custom backend commit fails.
 *
 * @example
 * ```ts
 * import { memory } from "@typed/navigation/memory"
 * import type { Destination } from "@typed/navigation/model"
 *
 * const entry: Destination = {
 *   id: "entry-1",
 *   key: "entry-1",
 *   url: new URL("https://example.com/products"),
 *   state: undefined,
 *   sameDocument: true
 * }
 * const NavigationLive = memory({ entries: [entry], currentIndex: 0, maxEntries: 50 })
 * ```
 * @since 1.0.0
 * @category Memory history providers
 */
export const memory = (options: MemoryOptions) =>
  Layer.effect(Navigation)(
    Effect.gen(function* () {
      const ids = yield* Effect.service(Uuid7State);
      const origin = options.origin ?? "http://localhost";
      const base = options.base ?? "/";
      const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
      const baseState = yield* RefSubject.make<NavigationState>({
        entries: options.entries,
        index: options.currentIndex ?? options.entries.length - 1,
        transition: Option.none(),
      });
      const state = RefSubject.transform(
        baseState,
        limitEntries(maxEntries),
        limitEntries(maxEntries),
      );

      const commit =
        options.commit ??
        ((
          before: BeforeNavigationEvent,
          runHandlers: (destination: Destination) => Effect.Effect<void>,
        ) => Effect.provideService(defaultCommit(before, runHandlers), Uuid7State, ids));

      return yield* makeNavigationCore(origin, base, state, commit);
    }),
  );

/**
 * Provides Navigation from one URL with generated entry identity.
 *
 * @remarks
 * ## Why
 * It is the concise SSR/test provider when no prior history snapshot exists, while preserving the
 * same identity and transition semantics as {@link memory}.
 *
 * ## Ownership and lifetime
 * Layer acquisition uses `Uuid7State` to create the initial key and id, then delegates state ownership to
 * `memory`. The Navigation service and subscriptions live until the Layer Scope closes.
 *
 * @example
 * ```ts
 * import { initialMemory } from "@typed/navigation/memory"
 *
 * const NavigationLive = initialMemory({ url: "/products?page=2", maxEntries: 50 })
 * ```
 * @since 1.0.0
 * @category Memory history providers
 */
export const initialMemory = (options: InitialMemoryOptions) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const key = yield* navigationId;
      const id = yield* navigationId;
      const origin = options.origin ?? "http://localhost";
      const url = getUrl(origin, options.url);
      const entry = proposedToDestination(
        {
          url,
          state: options.state,
          sameDocument: url.origin === origin,
        },
        key,
        id,
      );

      return memory({
        origin,
        entries: [entry],
        currentIndex: 0,
        ...options,
      });
    }),
  );

const defaultCommit = (
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    if (before.type === "traverse") {
      const destination = before.to as Destination;
      yield* runHandlers(destination);
      return destination;
    }

    const key = yield* navigationId;
    const id = yield* navigationId;
    const destination = proposedToDestination(before.to, key, id);
    yield* runHandlers(destination);
    return destination;
  });

const navigationId = uuid7.pipe(Effect.mapError((error) => new NavigationError({ error })));

const proposedToDestination = (
  before: ProposedDestination,
  key: string,
  id: string,
): Destination => ({
  key: before.key ?? key,
  url: before.url,
  state: before.state,
  sameDocument: before.sameDocument,
  id,
});
