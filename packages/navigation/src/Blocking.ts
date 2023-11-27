import type * as Computed from "@typed/fx/Computed"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Scope } from "effect"
import { Deferred, Effect, Option } from "effect"
import type { BeforeNavigationEvent, CancelNavigation, Destination, NavigateOptions, RedirectError } from "./Navigation"
import { cancelNavigation, Navigation, redirectToPath } from "./Navigation"

export interface BlockNavigation extends Computed.Computed<never, never, Option.Option<Blocking>> {
  readonly isBlocking: Computed.Computed<never, never, boolean>
}

export interface Blocking extends BeforeNavigationEvent {
  readonly cancel: Effect.Effect<never, never, Destination>
  readonly confirm: Effect.Effect<never, never, Destination>
  readonly redirect: (urlOrPath: string | URL, options?: NavigateOptions) => Effect.Effect<never, never, Destination>
}

type InternalBlockState = Unblocked | Blocked

type Unblocked = {
  readonly _tag: "Unblocked"
}
const Unblocked: Unblocked = { _tag: "Unblocked" }

type Blocked = {
  readonly _tag: "Blocked"
  readonly event: BeforeNavigationEvent
  readonly deferred: Deferred.Deferred<RedirectError | CancelNavigation, void>
}

const Blocked = (event: BeforeNavigationEvent) =>
  Effect.map(
    Deferred.make<RedirectError | CancelNavigation, void>(),
    (deferred): Blocked => ({ _tag: "Blocked", deferred, event })
  )

export interface UseBlockNavigationParams<R = never> {
  readonly shouldBlock?: (event: BeforeNavigationEvent) => Effect.Effect<R, RedirectError | CancelNavigation, boolean>
}

export const useBlockNavigation = <R = never>(
  params: UseBlockNavigationParams<R> = {}
): Effect.Effect<Navigation | R | Scope.Scope, never, BlockNavigation> =>
  Effect.gen(function*(_) {
    const navigation = yield* _(Navigation)
    const blockState = yield* _(RefSubject.of<InternalBlockState>(Unblocked))

    yield* _(
      navigation.beforeNavigation<R, never>((event) =>
        blockState.modifyEffect((state) =>
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
          })
        )
      )
    )

    const blockNavigation: BlockNavigation = Object.assign(
      blockState.map((s) => s._tag === "Blocked" ? Option.some(blockedToBlocking(navigation, s)) : Option.none()),
      { isBlocking: blockState.map((s) => s._tag === "Blocked") }
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
