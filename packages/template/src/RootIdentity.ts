import * as RefSubject from "@typed/fx/RefSubject";
import { uuid4 } from "@typed/id/Uuid4";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

/**
 * Allocate an island identity per execution and restore it through native hydration.
 * Requires the caller's Scope and RandomValues service; no entropy provider is installed here.
 */
export const rootIdentity = Effect.fn(function* (id?: string) {
  if (id !== undefined && (typeof id !== "string" || id.trim() === "")) {
    throw new TypeError("An explicit root id must be a nonempty string");
  }

  const state = yield* RefSubject.hydrate(
    Schema.String,
    id === undefined ? Effect.map(uuid4, (id) => `typed-${id}`) : Effect.succeed(id),
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
