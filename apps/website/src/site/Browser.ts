import { Fx } from "@typed/fx";
import { Effect } from "effect";

/** Native event registration is the boundary; consumers compose ordinary Fx values. */
export const events = <E extends Event = Event>(
  target: EventTarget,
  type: string,
  options?: AddEventListenerOptions,
): Fx.Fx<E> =>
  Fx.callback((emit) => {
    const listener = (event: Event) => emit.succeed(event as E);
    target.addEventListener(type, listener, options);
    return Effect.sync(() => target.removeEventListener(type, listener, options));
  });

/** A cached page keeps its document, but reacquires its active work on return. */
export const whilePageActive = <A, E, R>(view: Window, work: Effect.Effect<A, E, R>) =>
  Fx.mergeAll(
    Fx.succeed(true),
    events(view, "pagehide").pipe(Fx.map(() => false)),
    events<PageTransitionEvent>(view, "pageshow").pipe(Fx.map(() => true)),
  ).pipe(
    Fx.skipRepeats,
    Fx.switchMap((active) =>
      active ? Fx.fromEffect(Effect.scoped(Effect.andThen(work, Effect.never))) : Fx.empty,
    ),
    Fx.drain,
    Effect.scoped,
  );
