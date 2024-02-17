/**
 * @since 1.0.0
 */

import * as RefSubject from "@typed/fx/RefSubject"

import * as Data from "effect/Data"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

import type * as Scope from "effect/Scope"
import type {
  BeforeNavigationEvent,
  CancelNavigation,
  Destination,
  NavigateOptions,
  RedirectError
} from "./Navigation.js"
import { cancelNavigation, Navigation, redirectToPath } from "./Navigation.js"

/**
 * @since 1.0.0
 */
export interface BlockNavigation extends RefSubject.Computed<never, never, Option.Option<Blocking>> {
  readonly isBlocking: RefSubject.Computed<never, never, boolean>
}

/**
 * @since 1.0.0
 */
export interface Blocking extends BeforeNavigationEvent {
  readonly cancel: Effect.Effect<Destination>
  readonly confirm: Effect.Effect<Destination>
  readonly redirect: (urlOrPath: string | URL, options?: NavigateOptions) => Effect.Effect<Destination>
}

type InternalBlockState = Unblocked | Blocked

type Unblocked = {
  readonly _tag: "Unblocked"
}
const Unblocked: Unblocked = Data.struct({ _tag: "Unblocked" })

type Blocked = {
  readonly _tag: "Blocked"
  readonly event: BeforeNavigationEvent
  readonly deferred: Deferred.Deferred<void, RedirectError | CancelNavigation>
}

const Blocked = (event: BeforeNavigationEvent) =>
  Effect.map(
    Deferred.make<void, RedirectError | CancelNavigation>(),
    (deferred): Blocked => Data.struct({ _tag: "Blocked", deferred, event })
  )

/**
 * @since 1.0.0
 */
export interface UseBlockNavigationParams<R = never> {
  readonly shouldBlock?: (event: BeforeNavigationEvent) => Effect.Effect<boolean, RedirectError | CancelNavigation, R>
}

/**
 * @since 1.0.0
 */
export const useBlockNavigation = <R = never>(
  params: UseBlockNavigationParams<R> = {}
): Effect.Effect<BlockNavigation, never, Navigation | R | Scope.Scope> =>
  Effect.gen(function*(_) {
    const navigation = yield* _(Navigation)
    const blockState = yield* _(RefSubject.of<InternalBlockState>(Unblocked))

    yield* _(
      navigation.beforeNavigation<R, never>((event) =>
        RefSubject.modifyEffect(blockState, (state) =>
          Effect.gen(function*(_) {
            // Can't block twice
            if (state._tag === "Blocked") return [Option.none(), state] as const

            if (params.shouldBlock && !(yield* _(params.shouldBlock(event)))) {
              return [Option.none(), state] as const
            }

            const updated = yield* _(Blocked(event))

            return [
              Option.some(Deferred.await(updated.deferred)),
              updated
            ] as const
          }))
      )
    )

    const blockNavigation: BlockNavigation = Object.assign(
      RefSubject.map(blockState, (s) => {
        return s._tag === "Blocked" ? Option.some(blockedToBlocking(navigation, s)) : Option.none()
      }),
      {
        isBlocking: RefSubject.map(blockState, (s) => s._tag === "Blocked")
      }
    )

    return blockNavigation
  })

function blockedToBlocking(navigation: Navigation, state: Blocked): Blocking {
  return {
    ...state.event,
    cancel: Effect.zipRight(Deferred.fail(state.deferred, cancelNavigation), navigation.currentEntry),
    confirm: Effect.zipRight(Deferred.succeed(state.deferred, undefined), navigation.currentEntry),
    redirect: (url, options) =>
      Effect.zipRight(Deferred.fail(state.deferred, redirectToPath(url, options)), navigation.currentEntry)
  }
}
