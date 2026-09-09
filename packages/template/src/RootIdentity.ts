import * as RefSubject from "@typed/fx/RefSubject";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

/** Allocate an island identity per render and restore it through the native hydration protocol. */
export const rootIdentity = (id?: string) =>
  Effect.gen(function* () {
    if (id !== undefined && (typeof id !== "string" || id.trim() === "")) {
      throw new TypeError("An explicit root id must be a nonempty string");
    }

    const state = yield* RefSubject.hydrate(
      Schema.String,
      Effect.sync(() => id ?? `typed-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`),
      { name: "typed-root-id" },
    );
    const metadata = state[RefSubject.HydrationRefTypeId];
    const ref: RefSubject.HydrationRef = Object.assign(
      (element: RefSubject.HydrationElement) => state(element),
      {
        [RefSubject.HydrationRefTypeId]: {
          ...metadata,
          // Invalid renderer-owned identity metadata is a defect, not a component failure.
          toAttributes: Effect.orDie(metadata.toAttributes),
        },
      },
    );

    return { ref, id: Effect.orDie(state) };
  });
