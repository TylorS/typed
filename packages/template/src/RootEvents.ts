import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";

/** Selects native event names whose bubbling stops at an integration root.
 * false disables every boundary listener. Within a record, true stops that
 * event and false allows it, overriding an inherited setting for that name.
 * @since 1.0.0
 * @category Root event propagation
 */
export type RootEventOptions = false | Readonly<Record<string, boolean>>;

/** Default event propagation policy for integration roots. Defaults to false.
 * Override through Effect services; no global browser listeners are installed.
 * @since 1.0.0
 * @category Root event propagation
 */
export const CurrentRootEvents = Context.Reference<RootEventOptions>(
  "@typed/template/RootEvents/CurrentRootEvents",
  { defaultValue: () => false },
);

/** Installs scoped native bubbling listeners on a root.
 * Undefined options inherit CurrentRootEvents, records override inherited
 * event names individually, and false disables the inherited policy entirely.
 *
 * Only stopPropagation is called. Target handlers, other listeners on this same
 * root, and browser default actions remain available. Ancestor capture handlers
 * have already run; events that do not bubble to the root are not intercepted.
 * This is an event bubbling policy, not a security or complete event-isolation
 * boundary. Each listener is removed when the calling Scope closes.
 * @since 1.0.0
 * @category Root event propagation
 */
export const rootEvents = Effect.fn(function* (
  root: EventTarget,
  options?: RootEventOptions,
): Effect.fn.Return<void, never, Scope.Scope> {
  const inherited = yield* CurrentRootEvents;
  const selected = options === false ? {} : { ...inherited, ...options };
  const events = Object.keys(selected).filter((name) => selected[name]);

  if (events.length === 0) return;

  yield* Effect.acquireRelease(
    Effect.sync(() => {
      const stop = (event: Event) => event.stopPropagation();

      for (const name of events) root.addEventListener(name, stop, false);

      return () => {
        for (const name of events) root.removeEventListener(name, stop, false);
      };
    }),
    (remove) => Effect.sync(remove),
  );
});
