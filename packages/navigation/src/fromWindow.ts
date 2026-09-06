/**
 * @since 1.0.0
 */

import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Queue from "effect/Queue";
import { RefSubject } from "@typed/fx";
import { Uuid7State, uuid7 } from "@typed/id/Uuid7";
import { getUrl, makeNavigationCore, type NavigationState } from "./_core.js";
import {
  type BeforeNavigationEvent,
  type Destination,
  type ProposedDestination,
  NavigationError,
} from "./model.js";
import { Navigation } from "./Navigation.js";

const TYPED_KEY = "__typedNavigation" as const;
const HISTORY_VERSION = 1 as const;
// Keep aligned with memory.ts's private default without exposing a new public constant.
const DEFAULT_MAX_ENTRIES = 50;

type HistoryStatePayload = {
  readonly version: typeof HISTORY_VERSION;
  readonly session: string;
  readonly position: number;
  readonly entry: SerializableEntry;
};

type SerializableEntry = {
  readonly id: string;
  readonly key: string;
  readonly url: string;
  readonly state: unknown;
  readonly sameDocument: boolean;
};

type PendingTraversal = {
  readonly expected: Destination;
  readonly deferred: Deferred.Deferred<Destination, NavigationError>;
};

type PopStateActivation = {
  readonly raw: unknown;
  readonly href: string;
  readonly pending: PendingTraversal | undefined;
};

type HistoryMetadata = {
  readonly session: string;
  readonly position: number;
  readonly positions: ReadonlyMap<string, number>;
};

type LoadedHistoryState = HistoryMetadata & {
  readonly state: NavigationState;
};

function toSerializableEntry(d: Destination): SerializableEntry {
  return {
    id: d.id,
    key: d.key,
    url: d.url.href,
    state: d.state,
    sameDocument: d.sameDocument,
  };
}

function fromSerializableEntry(entry: SerializableEntry, origin: string): Destination {
  const url = getUrl(origin, entry.url);
  return {
    ...entry,
    url,
    sameDocument: url.origin === origin,
  };
}

function makeDestination(
  proposed: ProposedDestination,
): Effect.Effect<Destination, NavigationError, Uuid7State> {
  return Effect.gen(function* () {
    const id = yield* navigationId;
    const key = proposed.key ?? (yield* navigationId);
    return {
      id,
      key,
      url: proposed.url,
      state: proposed.state,
      sameDocument: proposed.sameDocument,
    };
  });
}

const navigationId = uuid7.pipe(Effect.mapError((error) => new NavigationError({ error })));

/**
 * Provides Navigation by adapting a browser Window's History API and `popstate` events.
 *
 * @remarks
 * ## Why
 * Browser history remains the platform authority while Typed adds reactive entries, stable keys,
 * scoped handlers, and typed failures. Existing or foreign history state is reconciled instead of
 * assuming every entry was created by Typed.
 *
 * ## Ownership and lifetime
 * Layer acquisition reads and normalizes current history, allocates entry identity through `Uuid7State`,
 * and installs the `popstate` listener. The Layer Scope owns that listener, pending traversals,
 * reactive state, and handler registrations. Browser calls, malformed URLs, and unknown traversal
 * state fail as `NavigationError`; interruption runs Effect finalizers but cannot undo a platform
 * history mutation that already completed.
 *
 * @example
 * ```ts
 * import { fromWindow } from "@typed/navigation/fromWindow"
 *
 * const NavigationLive = fromWindow(window)
 * ```
 *
 * Browser and server providers expose the same Navigation contract; server code should use
 * `@typed/navigation/memory` and must not evaluate the default `globalThis.window` argument.
 *
 * @since 1.0.0
 * @category Browser history provider
 */
export const fromWindow = (window: Window = globalThis.window) =>
  Layer.effect(Navigation)(
    Effect.gen(function* () {
      const ids = yield* Uuid7State;
      const origin = window.location.origin;
      const base = getBaseHref(window);
      const loaded = yield* getHistoryStateEffect(window, origin).pipe(
        Effect.provideService(Uuid7State, ids),
      );
      let session = loaded.session;
      let currentPosition = loaded.position;
      let positions = new Map(loaded.positions);
      let pendingTraversal: PendingTraversal | undefined;
      const baseState = yield* RefSubject.make(loaded.state);
      const state = RefSubject.transform(baseState, limitNavigationState, limitNavigationState);

      const prepareMetadata = (
        before: BeforeNavigationEvent,
        destination: Destination,
      ): HistoryMetadata =>
        prepareHistoryMetadata(session, currentPosition, positions, before, destination);
      const setMetadata = (prepared: HistoryMetadata) => {
        session = prepared.session;
        currentPosition = prepared.position;
        positions = new Map(prepared.positions);
      };

      yield* callHistory(() =>
        window.history.replaceState(
          toHistoryState(loaded.state.entries[loaded.state.index], session, currentPosition),
          "",
          window.location.href,
        ),
      ).pipe(Effect.ignore);

      // Keep ref in sync when user uses browser back/forward without going through our API
      const reconcilePopState = (raw: unknown, href: string) =>
        state.updates((ref) =>
          Effect.gen(function* () {
            const current = yield* ref.get;
            let activated = getActivatedHistoryState(
              raw,
              href,
              origin,
              current,
              session,
              positions,
            );
            if (activated === null) {
              const url = getUrl(origin, href);
              const destination = yield* makeDestination({
                url,
                state: raw,
                sameDocument: url.origin === origin,
              });
              activated = makeLoadedHistoryState(destination, destination.key, 0);
            }

            setMetadata(activated);
            return yield* ref.set(activated.state);
          }),
        );
      const handlePopState = ({ raw, href, pending }: PopStateActivation) =>
        Effect.gen(function* () {
          if (pending !== undefined && pendingTraversal === pending) {
            const activated = getPendingActivation(
              raw,
              href,
              origin,
              session,
              positions,
              pending.expected,
            );
            if (activated === null) return;

            pendingTraversal = undefined;
            currentPosition = activated.position;
            Deferred.doneUnsafe(pending.deferred, Effect.succeed(activated.destination));
            return;
          }

          yield* reconcilePopState(raw, href);
        }).pipe(
          Effect.provideService(Uuid7State, ids),
          Effect.catchCause((cause) =>
            Effect.gen(function* () {
              if (pending !== undefined && pendingTraversal === pending) {
                pendingTraversal = undefined;
                Deferred.doneUnsafe(
                  pending.deferred,
                  Effect.fail(new NavigationError({ error: Cause.squash(cause) })),
                );
              }
              yield* Effect.logError("Failed to reconcile browser history", cause);
            }),
          ),
        );

      const popstateEvents = yield* Queue.unbounded<PopStateActivation>();

      yield* Effect.forkScoped(
        Effect.forever(
          Effect.flatMap(Queue.take(popstateEvents), (activation) =>
            handlePopState(activation).pipe(Effect.provideService(Uuid7State, ids)),
          ),
        ),
      );

      yield* Effect.acquireRelease(
        Effect.sync(() => {
          const onPopState = (event: PopStateEvent) => {
            Queue.offerUnsafe(popstateEvents, {
              raw: event.state,
              href: window.location.href,
              pending: pendingTraversal,
            });
          };
          window.addEventListener("popstate", onPopState);
          return () => {
            window.removeEventListener("popstate", onPopState);
            const pending = pendingTraversal;
            if (pending !== undefined) {
              pendingTraversal = undefined;
              Deferred.doneUnsafe(
                pending.deferred,
                Effect.fail(
                  new NavigationError({
                    error: new Error("Navigation scope closed during history traversal"),
                  }),
                ),
              );
            }
          };
        }),
        (cleanup) => Effect.sync(cleanup),
      );

      const commit = (
        before: BeforeNavigationEvent,
        runHandlers: (destination: Destination) => Effect.Effect<void>,
      ) => {
        switch (before.type) {
          case "push":
          case "replace":
            return navigateCommit(window, before, runHandlers, prepareMetadata, setMetadata).pipe(
              Effect.provideService(Uuid7State, ids),
            );
          case "reload":
            return reloadCommit(window, before, runHandlers, prepareMetadata, setMetadata).pipe(
              Effect.provideService(Uuid7State, ids),
            );
          case "traverse":
            return traverseCommit(before, runHandlers, (expected, delta) =>
              Effect.gen(function* () {
                if (pendingTraversal !== undefined) {
                  return yield* new NavigationError({
                    error: new Error("A history traversal is already pending"),
                  });
                }

                const deferred = yield* Deferred.make<Destination, NavigationError>();
                const pending: PendingTraversal = { expected, deferred };
                pendingTraversal = pending;
                yield* callHistory(() => window.history.go(delta)).pipe(
                  Effect.tapError(() =>
                    Effect.sync(() => {
                      if (pendingTraversal === pending) pendingTraversal = undefined;
                    }),
                  ),
                );

                return yield* Effect.succeed(
                  Deferred.await(deferred).pipe(
                    Effect.onExit(() =>
                      Effect.sync(() => {
                        if (pendingTraversal === pending) pendingTraversal = undefined;
                      }),
                    ),
                  ),
                );
              }),
            );
        }
      };

      return yield* makeNavigationCore(origin, base, state, commit);
    }),
  );

function getBaseHref(win: Window): string {
  const base = win.document.querySelector("base");
  return base ? new URL(base.href, win.location.href).pathname : "/";
}

function getTypedState(
  raw: unknown,
  origin: string,
): { readonly payload: HistoryStatePayload; readonly destination: Destination } | null {
  try {
    if (!isRecord(raw) || !Object.prototype.hasOwnProperty.call(raw, TYPED_KEY)) return null;
    const payload = raw[TYPED_KEY];
    if (
      !isRecord(payload) ||
      payload.version !== HISTORY_VERSION ||
      typeof payload.session !== "string" ||
      payload.session.length === 0 ||
      !Number.isSafeInteger(payload.position) ||
      (payload.position as number) < 0 ||
      !isRecord(payload.entry)
    ) {
      return null;
    }

    const entry = payload.entry;
    if (
      typeof entry.id !== "string" ||
      entry.id.length === 0 ||
      typeof entry.key !== "string" ||
      entry.key.length === 0 ||
      typeof entry.url !== "string" ||
      typeof entry.sameDocument !== "boolean"
    ) {
      return null;
    }

    const serializable: SerializableEntry = {
      id: entry.id,
      key: entry.key,
      url: entry.url,
      state: entry.state,
      sameDocument: entry.sameDocument,
    };
    const destination = fromSerializableEntry(serializable, origin);
    return {
      payload: {
        version: HISTORY_VERSION,
        session: payload.session,
        position: payload.position as number,
        entry: serializable,
      },
      destination,
    };
  } catch {
    return null;
  }
}

function getHistoryStateEffect(
  win: Window,
  origin: string,
): Effect.Effect<LoadedHistoryState, NavigationError, Uuid7State> {
  const typed = getTypedState(win.history.state, origin);
  if (typed !== null) {
    return Effect.sync(() => {
      const url = getUrl(origin, win.location.href);
      return makeLoadedHistoryState(
        { ...typed.destination, url, sameDocument: url.origin === origin },
        typed.payload.session,
        typed.payload.position,
      );
    });
  }
  return Effect.gen(function* () {
    const id = yield* navigationId;
    const key = yield* navigationId;
    const url = getUrl(origin, win.location.href);
    const entry: Destination = {
      id,
      key,
      url,
      state: win.history.state === null ? undefined : win.history.state,
      sameDocument: true,
    };
    return makeLoadedHistoryState(entry, key, 0);
  });
}

function getActivatedHistoryState(
  raw: unknown,
  href: string,
  origin: string,
  current: NavigationState,
  session: string,
  positions: ReadonlyMap<string, number>,
): LoadedHistoryState | null {
  const typed = getTypedState(raw, origin);
  if (typed === null || typed.payload.session !== session) return null;

  const url = getUrl(origin, href);
  const destination: Destination = {
    ...typed.destination,
    url,
    sameDocument: url.origin === origin,
  };
  const { payload } = typed;
  const knownIndex = current.entries.findIndex((entry) => entry.key === destination.key);
  const entries = current.entries.slice(0);
  if (knownIndex !== -1) {
    if (positions.get(destination.key) !== payload.position) return null;
    entries[knownIndex] = destination;
  } else {
    let insertionIndex = entries.length;
    for (let index = 0; index < entries.length; index++) {
      const position = positions.get(entries[index].key);
      if (position === payload.position) return null;
      if (
        insertionIndex === entries.length &&
        position !== undefined &&
        position > payload.position
      ) {
        insertionIndex = index;
      }
    }
    entries.splice(insertionIndex, 0, destination);
  }

  const nextPositions = new Map(positions);
  nextPositions.set(destination.key, payload.position);
  return makeReconciledHistoryState(entries, destination, session, payload.position, nextPositions);
}

function getPendingActivation(
  raw: unknown,
  href: string,
  origin: string,
  session: string,
  positions: ReadonlyMap<string, number>,
  expected: Destination,
): { readonly destination: Destination; readonly position: number } | null {
  const expectedPosition = positions.get(expected.key);
  if (expectedPosition === undefined) return null;

  const url = getUrl(origin, href);
  const typed = getTypedState(raw, origin);
  if (
    typed === null ||
    typed.payload.session !== session ||
    typed.destination.key !== expected.key ||
    typed.destination.url.href !== expected.url.href ||
    url.href !== expected.url.href ||
    typed.payload.position !== expectedPosition
  ) {
    return null;
  }

  return {
    destination: { ...typed.destination, url, sameDocument: url.origin === origin },
    position: expectedPosition,
  };
}

function makeLoadedHistoryState(
  destination: Destination,
  session: string,
  position: number,
): LoadedHistoryState {
  return {
    session,
    position,
    positions: new Map([[destination.key, position]]),
    state: { entries: [destination], index: 0, transition: Option.none() },
  };
}

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null;

function prepareHistoryMetadata(
  session: string,
  currentPosition: number,
  positions: ReadonlyMap<string, number>,
  before: BeforeNavigationEvent,
  destination: Destination,
): HistoryMetadata {
  const position = before.type === "push" ? currentPosition + 1 : currentPosition;
  const nextPositions = new Map(positions);
  if (before.type === "push") {
    for (const [key, entryPosition] of nextPositions) {
      if (entryPosition > currentPosition) nextPositions.delete(key);
    }
  } else if (before.from.key !== destination.key) {
    nextPositions.delete(before.from.key);
  }
  nextPositions.set(destination.key, position);

  if (nextPositions.size > DEFAULT_MAX_ENTRIES) {
    let earliest: readonly [string, number] | undefined;
    for (const entry of nextPositions) {
      if (earliest === undefined || entry[1] < earliest[1]) earliest = entry;
    }
    if (earliest !== undefined) nextPositions.delete(earliest[0]);
  }

  return { session, position, positions: nextPositions };
}

function makeReconciledHistoryState(
  entries: ReadonlyArray<Destination>,
  destination: Destination,
  session: string,
  position: number,
  positions: ReadonlyMap<string, number>,
): LoadedHistoryState {
  const index = entries.findIndex((entry) => entry.key === destination.key);
  const state = limitNavigationState({ entries, index, transition: Option.none() });
  const retainedPositions = new Map<string, number>();
  for (const entry of state.entries) {
    const entryPosition = positions.get(entry.key);
    if (entryPosition !== undefined) retainedPositions.set(entry.key, entryPosition);
  }
  return {
    state,
    session,
    position,
    positions: retainedPositions,
  };
}

function limitNavigationState(state: NavigationState): NavigationState {
  if (state.entries.length <= DEFAULT_MAX_ENTRIES) return state;
  const start = Math.max(0, Math.min(state.index, state.entries.length - DEFAULT_MAX_ENTRIES));
  return {
    entries: state.entries.slice(start, start + DEFAULT_MAX_ENTRIES),
    index: state.index - start,
    transition: state.transition,
  };
}

function toHistoryState(
  destination: Destination,
  session: string,
  position: number,
): Record<string, unknown> {
  return {
    [TYPED_KEY]: {
      version: HISTORY_VERSION,
      session,
      position,
      entry: toSerializableEntry(destination),
    } satisfies HistoryStatePayload,
  };
}

const callHistory = (evaluate: () => void): Effect.Effect<void, NavigationError> =>
  Effect.try({
    try: evaluate,
    catch: (error) => new NavigationError({ error }),
  });

function navigateCommit(
  win: Window,
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
  prepareMetadata: (before: BeforeNavigationEvent, destination: Destination) => HistoryMetadata,
  setMetadata: (prepared: HistoryMetadata) => void,
): Effect.Effect<Destination, NavigationError, Uuid7State> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.gen(function* () {
      const destination = yield* restore(makeDestination(before.to));
      const prepared = prepareMetadata(before, destination);
      const historyState = toHistoryState(destination, prepared.session, prepared.position);
      const url = before.to.url.href;

      yield* callHistory(() => {
        if (before.type === "push") {
          win.history.pushState(historyState, "", url);
        } else {
          win.history.replaceState(historyState, "", url);
        }
      });

      setMetadata(prepared);
      yield* runHandlers(destination);
      return destination;
    }),
  );
}

function reloadCommit(
  win: Window,
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
  prepareMetadata: (before: BeforeNavigationEvent, destination: Destination) => HistoryMetadata,
  setMetadata: (prepared: HistoryMetadata) => void,
): Effect.Effect<Destination, NavigationError, Uuid7State> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.gen(function* () {
      const destination = yield* restore(makeDestination(before.to));
      const prepared = prepareMetadata(before, destination);

      yield* callHistory(() =>
        win.history.replaceState(
          toHistoryState(destination, prepared.session, prepared.position),
          "",
          win.location.href,
        ),
      );
      setMetadata(prepared);
      yield* runHandlers(destination);
      return destination;
    }),
  );
}

function traverseCommit(
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
  traverse: (
    expected: Destination,
    delta: number,
  ) => Effect.Effect<Effect.Effect<Destination, NavigationError>, NavigationError>,
): Effect.Effect<Destination, NavigationError> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.gen(function* () {
      const waitForActivation = yield* traverse(before.to as Destination, before.delta);
      const destination = yield* restore(waitForActivation);
      yield* runHandlers(destination);
      return destination;
    }),
  );
}
