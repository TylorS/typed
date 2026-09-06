import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import {
  DomRenderTemplate,
  render as renderDom,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";

/**
 * Live Storybook mount and its explicit asynchronous disposer.
 *
 * @remarks
 * ## Why
 * Stories need access to the actual canvas for assertions and deterministic
 * teardown of a long-lived reactive render.
 *
 * ## Ownership and lifetime
 * The mount owns its private Scope and render fiber. `dispose` interrupts the
 * fiber and closes the Scope exactly once; callers own appending/removing the
 * returned canvas. If the canvas is connected, disposal does not disconnect the
 * removal observer; removing the canvas is the observer's cleanup boundary.
 *
 * @since 1.0.0
 * @category Story lifetime
 */
export interface MountedStory {
  /** Detached div containing the story's real rendered DOM. */
  readonly canvas: HTMLDivElement;
  /** Idempotently closes rendering; remove a connected canvas to release its observer. */
  readonly dispose: () => Promise<void>;
}

/**
 * Mounts a Typed component in an isolated Storybook canvas.
 *
 * The mount stays alive after its first render so reactive attributes and event
 * handlers remain attached. It is released explicitly or when Storybook
 * removes the canvas from its document.
 *
 * @remarks
 * ## Why
 *
 * Waiting only for the first `RenderEvent` and then ending the fiber would
 * detach reactive attributes and event handlers. This helper keeps the Typed
 * renderer alive while still giving tests an explicit disposal boundary.
 *
 * ## Ownership and lifetime
 *
 * `mount` creates an unsafe Scope dedicated to this story, starts the render
 * fiber, and resolves only after the first event. `dispose` interrupts and
 * closes it idempotently. After the canvas has once been connected, a
 * document-scoped MutationObserver disposes it when removed and then disconnects.
 * Calling `dispose` while the canvas is still connected does **not** disconnect
 * that observer: it continues retaining the document, canvas, and disposal
 * closure until the canvas is removed. Tests or hosts that keep a disposed
 * canvas connected must remove it themselves to release that observer. If
 * rendering fails before the first event, Scope cleanup runs before rejection
 * and no removal observer is installed.
 *
 * ## Platform requirements
 *
 * This is a browser/testing API. The provided Document supplies element and
 * MutationObserver implementations. The canvas is returned detached so
 * Storybook or a test controls where it enters the DOM.
 *
 * @example
 * ```ts
 * import { mount } from "@typed/ui/Storybook"
 * import { html } from "@typed/template"
 *
 * const story = await mount(html`<button type="button">Save</button>`)
 * document.body.append(story.canvas)
 * // Run interactions and assertions against story.canvas.
 * await story.dispose()
 * story.canvas.remove() // disconnects the removal observer
 * ```
 *
 * @since 1.0.0
 * @category Story mounting
 */
export async function mount<E>(
  content: Fx.Fx<RenderEvent, E, Scope.Scope | RenderTemplate>,
  document: Document = globalThis.document,
): Promise<MountedStory> {
  const canvas = document.createElement("div");
  const scope = Scope.makeUnsafe();
  const mounted = Deferred.makeUnsafe<void>();
  let disposed = false;
  let fiber: Fiber.Fiber<void, E> | undefined;

  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    if (fiber !== undefined) {
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
    await Effect.runPromise(Scope.close(scope, Exit.void));
  };

  fiber = Effect.runFork(
    Scope.provide(
      Fx.drain(
        renderDom(content, canvas).pipe(Fx.tap(() => Deferred.succeed(mounted, undefined))),
      ).pipe(Effect.provide(DomRenderTemplate.using(document))),
      scope,
    ),
  );

  try {
    const endedBeforeMount = Effect.andThen(
      Fiber.join(fiber),
      Effect.die("Story completed before rendering any content"),
    );
    await Effect.runPromise(Effect.raceFirst(Deferred.await(mounted), endedBeforeMount));
  } catch (error) {
    await dispose();
    throw error;
  }
  disposeWhenRemoved(canvas, document, dispose);
  return { canvas, dispose };
}

function disposeWhenRemoved(
  canvas: HTMLDivElement,
  document: Document,
  dispose: () => Promise<void>,
) {
  const MutationObserver = document.defaultView?.MutationObserver;
  if (MutationObserver === undefined) return;

  let connected = canvas.isConnected;
  const observer = new MutationObserver(() => {
    if (canvas.isConnected) {
      connected = true;
    } else if (connected) {
      observer.disconnect();
      void dispose();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
  queueMicrotask(() => {
    if (canvas.isConnected) connected = true;
  });
}
