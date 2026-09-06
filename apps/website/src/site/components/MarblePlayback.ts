import { Fx, RefSubject } from "@typed/fx";
import {
  CurrentRenderPriority,
  DomRenderTemplate,
  render,
} from "@typed/template/Render";
import { RenderPriority } from "@typed/template/RenderQueue";
import { Deferred, Effect } from "effect";
import { diagramTicks, parseFxMarble } from "../../docs/MarbleDiagram.js";
import { events } from "../Browser.js";
import {
  initialMarbleState,
  MarbleView,
  type MarbleActions,
  type MarbleState,
} from "./MarbleView.js";

type BrowserWindow = NonNullable<Document["defaultView"]>;
interface ActivePlayer {
  readonly id: symbol;
  readonly pause: Effect.Effect<void>;
}

/** The callback owns one pending frame; Fx owns callback delivery and cleanup. */
const frames = (view: BrowserWindow) =>
  Fx.callback<number>((emit) => {
    const tick = (time: number) => {
      frame = view.requestAnimationFrame(tick);
      emit.succeed(time);
    };
    let frame = view.requestAnimationFrame(tick);
    return Effect.sync(() => view.cancelAnimationFrame(frame));
  });

const visibility = (view: BrowserWindow, element: HTMLElement) =>
  "IntersectionObserver" in view
    ? Fx.callback<boolean>((emit) => {
        const observer = new view.IntersectionObserver(([entry]) => {
          if (entry) emit.succeed(entry.isIntersecting);
        });
        observer.observe(element);
        return Effect.sync(() => observer.disconnect());
      })
    : Fx.succeed(true);

interface PlaybackRun {
  readonly startedAt: number;
  readonly startedFrom: number;
  readonly speed: number;
}
const positionAt = (run: PlaybackRun, time: number, lastTick: number) =>
  Math.min(
    lastTick,
    run.startedFrom + (Math.max(0, time - run.startedAt) * run.speed) / 1000,
  );

/** Geometry is a browser boundary; application state and DOM bindings stay in Typed. */
const follow = (figure: HTMLElement, state: MarbleState, ticks: number) =>
  Effect.sync(() => {
    const viewport = figure.querySelector<HTMLElement>(".fx-marble__viewport");
    const clock = figure.querySelector<HTMLElement>(".fx-marble__clock");
    const label = figure.querySelector<HTMLElement>(".fx-marble__label");
    if (
      !viewport ||
      !clock ||
      !label ||
      viewport.scrollWidth <= viewport.clientWidth
    )
      return;
    const bounds = viewport.getBoundingClientRect();
    const track = clock.getBoundingClientRect();
    const left = label.getBoundingClientRect().right;
    const right = bounds.left + viewport.clientLeft + viewport.clientWidth - 8;
    const time = state.reducedMotion
      ? Math.floor(state.position)
      : state.position;
    const cellWidth = track.width / ticks;
    const center = track.left + (time + 0.5) * cellWidth;
    const available = right - left;
    const behind = Math.min(cellWidth / 2 + 4, available / 2);
    // Leave upcoming events in view instead of waiting for the cursor to hit the edge.
    const ahead = Math.min(
      Math.max(cellWidth * 1.5, available * 0.45),
      available - behind,
    );
    viewport.scrollLeft +=
      center - Math.max(left + behind, Math.min(right - ahead, center));
  });

const makePlayback = Effect.fn(function* (
  view: BrowserWindow,
  ticks: number,
  active: RefSubject.RefSubject<ActivePlayer | undefined>,
) {
  const id = Symbol();
  const lastTick = ticks - 1;
  const media = view.matchMedia("(prefers-reduced-motion: reduce)");
  const state = yield* RefSubject.make<MarbleState>({
    ...initialMarbleState,
    enhanced: true,
    reducedMotion: media.matches,
  });
  // Commands control resource lifetime. Frame delivery only updates presentation state.
  const runs = yield* RefSubject.make<PlaybackRun | undefined>(undefined);
  const pageActive = yield* RefSubject.make(!view.document.hidden);
  const pause = Effect.gen(function* () {
    const current = yield* state;
    const run = yield* runs;
    const position =
      current.playing && run
        ? positionAt(run, view.performance.now(), lastTick)
        : current.position;
    yield* RefSubject.set(runs, undefined);
    yield* RefSubject.update(state, (state) => ({
      ...state,
      position,
      playing: false,
    }));
    yield* RefSubject.update(active, (current) =>
      current?.id === id ? undefined : current,
    );
  });
  const seek = Effect.fn(function* (tick: number) {
    yield* pause;
    yield* RefSubject.update(state, (state) => ({
      ...state,
      position: Math.max(0, Math.min(lastTick, tick)),
      followRevision: state.followRevision + 1,
    }));
  });
  const play = Effect.gen(function* () {
    const current = yield* state;
    if (current.playing) return yield* pause;
    const previous = yield* active;
    if (previous && previous.id !== id) yield* previous.pause;
    yield* RefSubject.set(active, { id, pause });
    const position = current.position >= lastTick ? 0 : current.position;
    yield* RefSubject.update(state, (state) => ({
      ...state,
      position,
      playing: true,
    }));
    yield* RefSubject.set(runs, {
      startedAt: view.performance.now(),
      startedFrom: position,
      speed: current.speed,
    });
  });
  const positions = runs.pipe(
    Fx.skipRepeats,
    Fx.switchMap((run) =>
      run
        ? frames(view).pipe(
            Fx.map((time) => positionAt(run, time, lastTick)),
            Fx.dropAfter((position) => position >= lastTick),
          )
        : Fx.empty,
    ),
  );
  yield* Effect.forkScoped(
    Fx.observe(positions, (position) =>
      Effect.gen(function* () {
        yield* RefSubject.update(state, (state) => ({
          ...state,
          position,
          playing: position < lastTick,
        }));
        if (position >= lastTick)
          yield* RefSubject.update(active, (current) =>
            current?.id === id ? undefined : current,
          );
      }),
    ),
  );
  const pageActivity = Fx.mergeAll(
    events(view, "pagehide").pipe(Fx.map(() => false)),
    events(view, "pageshow").pipe(Fx.map(() => !view.document.hidden)),
    events(view.document, "visibilitychange").pipe(
      Fx.map(() => !view.document.hidden),
    ),
  ).pipe(Fx.skipRepeats);
  yield* Effect.forkScoped(
    Fx.observe(pageActivity, (active) =>
      active
        ? RefSubject.set(pageActive, true)
        : Effect.andThen(pause, RefSubject.set(pageActive, false)),
    ),
  );
  const motion = pageActive.pipe(
    Fx.skipRepeats,
    Fx.switchMap((active) =>
      active
        ? Fx.mergeAll(
            Fx.sync(() => media.matches),
            events<MediaQueryListEvent>(media, "change").pipe(
              Fx.map((event) => event.matches),
            ),
          )
        : Fx.empty,
    ),
  );
  yield* Effect.forkScoped(
    Fx.observe(motion, (reducedMotion) =>
      RefSubject.update(state, (state) => ({ ...state, reducedMotion })),
    ),
  );

  const attach = Effect.fn(function* (figure: HTMLElement) {
    yield* Effect.forkScoped(
      Fx.observe(
        pageActive.pipe(
          Fx.skipRepeats,
          Fx.switchMap((active) =>
            active ? visibility(view, figure) : Fx.empty,
          ),
        ),
        (visible) =>
          visible
            ? Effect.void
            : Effect.flatMap(state, (state) =>
                state.playing ? pause : Effect.void,
              ),
      ),
    );
    // Ignore unrelated state changes so paused diagrams remain freely scrollable.
    yield* Effect.forkScoped(
      Fx.observe(
        state.pipe(
          Fx.skipRepeatsWith(
            (a, b) =>
              a.position === b.position &&
              a.followRevision === b.followRevision &&
              a.reducedMotion === b.reducedMotion,
          ),
          Fx.skip(1),
        ),
        (state) => follow(figure, state, ticks),
      ),
    );
  });
  const actions: MarbleActions = {
    play,
    restart: seek(0),
    previous: Effect.flatMap(state, (state) =>
      seek(Math.ceil(state.position) - 1),
    ),
    next: Effect.flatMap(state, (state) =>
      seek(Math.floor(state.position) + 1),
    ),
    seek,
    speed: Effect.fn(function* (speed: number) {
      const current = yield* state;
      const run = yield* runs;
      const time = view.performance.now();
      const position =
        current.playing && run
          ? positionAt(run, time, lastTick)
          : current.position;
      yield* RefSubject.update(state, (state) => ({
        ...state,
        position,
        speed,
      }));
      if (current.playing)
        yield* RefSubject.set(runs, {
          startedAt: time,
          startedFrom: position,
          speed,
        });
    }),
    attach,
  };
  return { state, actions, pause };
});

const enhanceMarble = Effect.fn(function* (
  mount: HTMLElement,
  active: RefSubject.RefSubject<ActivePlayer | undefined>,
) {
  const source = mount.dataset.fxMarbleSource;
  const diagram = source === undefined ? undefined : parseFxMarble(source);
  const view = mount.ownerDocument.defaultView;
  if (!diagram || !view) return;
  const model = yield* makePlayback(view, diagramTicks(diagram), active);
  const ready = yield* Deferred.make<void>();
  yield* Effect.forkScoped(
    Fx.observe(
      render(MarbleView(diagram, model.state, model.actions), mount),
      () => Deferred.succeed(ready, undefined),
    ).pipe(Effect.catchCause((cause) => Deferred.failCause(ready, cause))),
  );
  yield* Deferred.await(ready);
  // Restore the complete static view before rendering subscriptions are released.
  yield* Effect.addFinalizer(() =>
    Effect.andThen(
      model.pause,
      RefSubject.update(model.state, (state) => ({
        ...state,
        enhanced: false,
      })),
    ),
  );
});

/** Returns after setup; the caller's Scope owns every player, subscription and native resource. */
export const enhanceMarbles = Effect.fn(
  function* (root: ParentNode) {
    const active = yield* RefSubject.make<ActivePlayer | undefined>(undefined);
    yield* Effect.forEach(
      root.querySelectorAll<HTMLElement>("[data-fx-marble-source]"),
      (mount) => enhanceMarble(mount, active),
      { concurrency: "unbounded", discard: true },
    );
  },
  Effect.provide(DomRenderTemplate),
  Effect.provideService(CurrentRenderPriority, RenderPriority.Sync),
);
