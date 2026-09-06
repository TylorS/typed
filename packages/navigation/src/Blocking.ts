/**
 * @since 1.0.0
 */

import { RefSubject } from "@typed/fx";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import {
  type BeforeNavigationEvent,
  CancelNavigation,
  type Destination,
  RedirectError,
} from "./model.js";
import { Navigation, type NavigationNavigateOptions } from "./Navigation.js";

/**
 * Exposes the currently blocked transition as reactive state plus an `isBlocking` projection.
 *
 * @remarks
 * ## Why
 * A dialog or other UI can observe unsaved-work navigation without owning the navigation service or
 * coupling state to a renderer.
 *
 * ## Ownership and lifetime
 * The RefSubject and handler registration belong to the Scope that runs {@link useBlockNavigation}.
 * Closing that Scope cancels an outstanding block and unregisters the handler.
 *
 * @since 1.0.0
 * @category Blocking state
 */
export interface BlockNavigation extends RefSubject.Filtered<Blocking> {
  /**
   * Reactively reports whether one transition awaits settlement.
   *
   * @remarks
   * ## Why
   * A renderer can show blocking UI without sampling or owning the Navigation service.
   *
   * ## Ownership and lifetime
   * The blocker Scope owns this reactive member; observing it does not extend that Scope.
   *
   * @since 1.0.0
   * @category Blocking state
   */
  readonly isBlocking: RefSubject.Computed<boolean>;
}

/**
 * Presents one blocked transition and the three ways its owner can settle it.
 *
 * @remarks
 * ## Why
 * Confirm, cancel, and redirect are explicit Effects so a UI cannot accidentally settle navigation
 * merely by reading state. Only the first settlement of the active block changes it.
 *
 * ## Ownership and lifetime
 * The Scope that registered the blocker owns this value's deferred settlement. `confirm` resumes the
 * original transition, `cancel` keeps the current destination, and `redirect` starts a replacement.
 *
 * @since 1.0.0
 * @category Blocking decisions
 */
export interface Blocking extends BeforeNavigationEvent {
  /**
   * Cancels the outstanding blocked transition.
   *
   * @remarks
   * ## Why
   * Cancellation explicitly keeps the current destination and releases the deferred transition.
   *
   * ## Ownership and lifetime
   * Running `cancel` completes the owned Deferred with the current Destination and clears only this
   * blocker instance's outstanding transition.
   *
   * @since 1.0.0
   * @category Blocking decisions
   */
  readonly cancel: Effect.Effect<Destination>;
  /**
   * Confirms and resumes the outstanding blocked transition.
   *
   * @remarks
   * ## Why
   * Settlement is an Effect, so merely observing blocking state cannot accidentally navigate.
   *
   * ## Ownership and lifetime
   * Running `confirm` completes the owned Deferred with the original navigation Effect. The blocker
   * Scope keeps ownership until that Effect settles or the Scope closes.
   *
   * @since 1.0.0
   * @category Blocking decisions
   */
  readonly confirm: Effect.Effect<Destination>;
  /**
   * Replaces the outstanding blocked transition with another destination.
   *
   * @remarks
   * ## Why
   * Blocked flows can choose a safe destination without first committing the rejected one.
   *
   * ## Ownership and lifetime
   * Running `redirect` completes the owned Deferred with a replacement navigation Effect. The
   * original proposed transition is never committed by this settlement.
   *
   * @since 1.0.0
   * @category Blocking decisions
   */
  readonly redirect: (
    urlOrPath: string | URL,
    options?: NavigationNavigateOptions,
  ) => Effect.Effect<Destination>;
}

type InternalBlockState = Unblocked | Blocked;

type Unblocked = {
  readonly _tag: "Unblocked";
};
const Unblocked: Unblocked = { _tag: "Unblocked" };

type Blocked = {
  readonly _tag: "Blocked";
  readonly event: BeforeNavigationEvent;
  readonly deferred: Deferred.Deferred<void, RedirectError | CancelNavigation>;
};

const Blocked = (event: BeforeNavigationEvent) =>
  Effect.map(Deferred.make<void, RedirectError | CancelNavigation>(), (deferred): Blocked => ({
    _tag: "Blocked",
    deferred,
    event,
  }));

/**
 * Configures the optional Effectful predicate used before a transition is blocked.
 *
 * @remarks
 * ## Why
 * Applications can restrict blocking to dirty forms or selected destinations while keeping that
 * decision in the same typed Effect environment as their state.
 *
 * ## Ownership and lifetime
 * This object acquires no resources. Its predicate runs in the Scope and captured context of
 * {@link useBlockNavigation}; redirects and cancellations remain typed navigation control flow.
 *
 * @since 1.0.0
 * @category Blocking policy
 */
export interface UseBlockNavigationParams<R = never> {
  /**
   * Decides Effectfully whether a proposed transition should be blocked.
   *
   * @remarks
   * ## Why
   * Dirty-state checks can use services and still redirect or cancel through typed control flow.
   *
   * ## Ownership and lifetime
   * The blocker Scope owns this reactive member; observing it does not extend that Scope.
   *
   * @since 1.0.0
   * @category Blocking policy
   */
  readonly shouldBlock?: (
    event: BeforeNavigationEvent,
  ) => Effect.Effect<boolean, RedirectError | CancelNavigation, R>;
}

/**
 * Registers a scoped navigation blocker and returns renderer-independent blocking state.
 *
 * @remarks
 * ## Why
 * Unsaved-work flows need to pause navigation without replacing the provider or forcing state into a
 * UI component. At most one transition is outstanding; later attempts are not independently queued.
 *
 * ## Ownership and lifetime
 * The required Scope owns the before-navigation registration, RefSubject, and deferred settlement.
 * Scope closure cancels an outstanding transition and finalizes the registration. Consumers must
 * observe and settle the returned state inside that owning Scope.
 *
 * @example
 * ```ts
 * import { useBlockNavigation } from "@typed/navigation/Blocking"
 * import * as Effect from "effect/Effect"
 *
 * const blocker = useBlockNavigation({ shouldBlock: () => Effect.succeed(true) })
 * ```
 *
 * Scope behavior follows Effect v4 resource management:
 * https://effect.website/docs/resource-management/scope/.
 *
 * @since 1.0.0
 * @category Blocking policy
 */
export const useBlockNavigation = <R = never>(
  params: UseBlockNavigationParams<R> = {},
): Effect.Effect<BlockNavigation, never, Navigation | R | Scope.Scope> =>
  Effect.gen(function* () {
    const navigation = yield* Navigation;
    const blockState = yield* RefSubject.make<InternalBlockState>(Unblocked);

    yield* navigation.onBeforeNavigation<R, never>((event) =>
      RefSubject.modifyEffect(blockState, (state) =>
        Effect.gen(function* () {
          // Can't block twice
          if (state._tag === "Blocked") return [Option.none(), state] as const;

          if (params.shouldBlock && !(yield* params.shouldBlock(event))) {
            return [Option.none(), state] as const;
          }

          const updated = yield* Blocked(event);

          return [
            Option.some(
              Deferred.await(updated.deferred).pipe(
                Effect.ensuring(resetBlocked(blockState, updated)),
              ),
            ),
            updated,
          ] as const;
        }),
      ),
    );

    const blockNavigation: BlockNavigation = Object.assign(
      RefSubject.filterMap(blockState, (s) => {
        return s._tag === "Blocked"
          ? Option.some(blockedToBlocking(navigation, blockState, s))
          : Option.none();
      }),
      {
        isBlocking: RefSubject.map(blockState, (s) => s._tag === "Blocked"),
      },
    );

    yield* Effect.addFinalizer(() =>
      RefSubject.update(blockState, (state) => {
        if (state._tag === "Unblocked") return state;
        Deferred.doneUnsafe(state.deferred, Effect.fail(new CancelNavigation()));
        return Unblocked;
      }),
    );

    return blockNavigation;
  });

function blockedToBlocking(
  navigation: Navigation["Service"],
  blockState: RefSubject.RefSubject<InternalBlockState>,
  state: Blocked,
): Blocking {
  return {
    ...state.event,
    cancel: settleBlocked(blockState, state, Effect.fail(new CancelNavigation())).pipe(
      Effect.andThen(navigation.currentEntry),
    ),
    confirm: settleBlocked(blockState, state, Effect.void).pipe(
      Effect.andThen(navigation.currentEntry),
    ),
    redirect: (url, options) =>
      settleBlocked(blockState, state, Effect.fail(new RedirectError({ url, options }))).pipe(
        Effect.andThen(navigation.currentEntry),
      ),
  };
}

const settleBlocked = (
  blockState: RefSubject.RefSubject<InternalBlockState>,
  blocked: Blocked,
  result: Effect.Effect<void, RedirectError | CancelNavigation>,
) =>
  RefSubject.update(blockState, (state) => {
    if (state._tag !== "Blocked" || state.deferred !== blocked.deferred) return state;
    Deferred.doneUnsafe(blocked.deferred, result);
    return Unblocked;
  });

const resetBlocked = (blockState: RefSubject.RefSubject<InternalBlockState>, blocked: Blocked) =>
  RefSubject.update(blockState, (state) =>
    state._tag === "Blocked" && state.deferred === blocked.deferred ? Unblocked : state,
  );
