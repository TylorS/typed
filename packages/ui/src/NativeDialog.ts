import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import type * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";

interface State {
  readonly open: boolean;
}

/** Native dialog synchronization mode.
 * @remarks
 * ## Why
 * The choice maps directly to `showModal()` or `show()` rather than simulating
 * modality in application code.
 * ## Ownership and lifetime
 * Options are inert and retain no resources.
 * @since 1.0.0
 * @category Native display options
 */
export interface Options {
  /** Whether opening uses the modal top layer; defaults to true.
   * @remarks
   * ## Why
   * Modal and non-modal dialogs have different focus, inertness, and dismissal
   * behavior owned by the browser.
   * ## Ownership and lifetime
   * The flag is read during synchronization and retains no resources.
   * @since 1.0.0
   * @category Native display options
   */
  readonly modal?: boolean;
}

/**
 * Creates a scoped ref that drives a real `HTMLDialogElement` from state.
 *
 * @remarks
 * ## Why
 *
 * The ref delegates open/close, top-layer placement, focus handling, and modal
 * inertness to `showModal()`, `show()`, and `close()`. It does not reproduce a
 * dialog with ordinary divs or synthetic events.
 *
 * ## Ownership and lifetime
 *
 * Applying the ref forks an observer in the current Effect Scope. Modal opening
 * waits for a detached host to connect; a newer state or Scope finalization cancels
 * that pending connection check. Hidden documents may defer the check until animation
 * frames resume. Finalization does not close state owned elsewhere or remove
 * the element. `Dialog.Content` handles native `cancel`, `close`, and `toggle`
 * events and composes exactly one hydration owner.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 * import * as NativeDialog from "@typed/ui/NativeDialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState()
 *   return NativeDialog.ref(state, { modal: true })
 * })
 * ```
 *
 * @since 1.0.0
 * @category Native synchronization
 */
export function ref<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  options: Options = {},
): (element: HTMLDialogElement) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn(function* (element) {
    let pending: Fiber.Fiber<void> | undefined;
    yield* Effect.forkScoped(
      Fx.observe(state, Effect.fn(function* (value) {
        if (pending !== undefined) {
          const previous = pending;
          pending = undefined;
          yield* Fiber.interrupt(previous);
        }
        const update = Effect.sync(() => synchronize(element, value.open, options));
        if (value.open && options.modal !== false && !element.isConnected) {
          pending = yield* Effect.forkScoped(Effect.andThen(whenConnected(element), update));
        } else {
          // Complete connected transitions before queued native lifecycle events
          // can reflect an older open state back into the application.
          yield* update;
        }
      })),
    );
  });
}

// Template refs run before their host is inserted. Native showModal requires a connected element.
function whenConnected(element: HTMLDialogElement): Effect.Effect<void> {
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

function synchronize(element: HTMLDialogElement, open: boolean, options: Options): void {
  if (open) {
    if (element.open) return;
    if (options.modal === false) element.show();
    else element.showModal();
  } else if (element.open) {
    element.close();
  }
}
