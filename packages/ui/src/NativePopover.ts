import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

/**
 * Creates a scoped ref that synchronizes state with the native Popover API.
 *
 * @remarks
 * ## Why
 *
 * The browser owns top-layer placement and popover lifecycle. The ref checks
 * `:popover-open` before calling `showPopover()` or `hidePopover()`, avoiding
 * invalid duplicate transitions while preserving native toggle events.
 *
 * ## Ownership and lifetime
 *
 * Applying the ref forks one observer in the current Effect Scope. Opening
 * waits for a detached host to connect. A newer state or Scope finalization
 * cancels that pending connection check; hidden documents may defer it until
 * animation frames resume. Closing the Scope interrupts observation without
 * removing the host or closing caller-owned state. The host must support the Popover API and retain its `popover`
 * attribute. Only one hydration owner may be composed for the element.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as NativePopover from "@typed/ui/NativePopover"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Popover.makeState()
 *   return NativePopover.ref(state)
 * })
 * ```
 *
 * @since 1.0.0
 * @category Native synchronization
 */
export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn(function* (element) {
    let pending: Fiber.Fiber<void> | undefined;
    yield* Effect.forkScoped(
      Fx.observe(state, Effect.fn(function* (value) {
        if (pending !== undefined) {
          const previous = pending;
          pending = undefined;
          yield* Fiber.interrupt(previous);
        }
        const update = Effect.sync(() => synchronize(element, value.open));
        if (value.open && !element.isConnected) {
          pending = yield* Effect.forkScoped(Effect.andThen(whenConnected(element), update));
        } else {
          // Connected transitions stay in the observer: Menu/Select can focus
          // their now-visible items immediately after updating open state.
          yield* update;
        }
      })),
    );
  });
}

// Template refs run before insertion; native showPopover requires a connected host.
function whenConnected(element: HTMLElement): Effect.Effect<void> {
  return Effect.callback((resume) => {
    if (element.isConnected) {
      resume(Effect.void);
      return;
    }
    const check = () => {
      if (element.isConnected) resume(Effect.void);
      else frame = requestAnimationFrame(check);
    };
    let frame = requestAnimationFrame(check);
    return Effect.sync(() => cancelAnimationFrame(frame));
  });
}

function synchronize(element: HTMLElement, open: boolean): void {
  if (open) {
    if (!element.matches(":popover-open")) element.showPopover();
  } else if (element.matches(":popover-open")) {
    element.hidePopover();
  }
}
