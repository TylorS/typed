import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

/**
 * Creates a scoped ref that synchronizes state to a native `<details>` element.
 *
 * @remarks
 * ## Why
 *
 * `<details>` already owns disclosure rendering and keyboard behavior. This ref
 * only applies pushed `open` state to that real element; the public Disclosure
 * component listens to native `toggle` events for the reverse direction.
 *
 * ## Ownership and lifetime
 *
 * Applying the ref forks one observer in the current Effect Scope. Scope
 * finalization interrupts it; the state remains owned by its original Scope and
 * the DOM element remains owned by its renderer. Use only one hydration ref
 * owner for an element.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Disclosure from "@typed/ui/Disclosure"
 * import * as NativeDetails from "@typed/ui/NativeDetails"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Disclosure.makeState()
 *   return NativeDetails.ref(state)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Native synchronization
 */
export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLDetailsElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn((element) =>
    Effect.asVoid(
      Effect.forkScoped(
        Fx.observe(
          state,
          Effect.fn((value) =>
            Effect.sync(() => {
              if (element.open !== value.open) element.open = value.open;
            }),
          ),
        ),
      ),
    ),
  );
}
