import * as Fx from "@typed/fx/Fx";
import * as Hydration from "@typed/fx/RefSubject";
import * as RefBigDecimal from "@typed/fx/RefBigDecimal";
import * as RefBigInt from "@typed/fx/RefBigInt";
import * as RefBoolean from "@typed/fx/RefBoolean";
import * as RefCause from "@typed/fx/RefCause";
import * as RefDateTime from "@typed/fx/RefDateTime";
import * as RefDuration from "@typed/fx/RefDuration";
import * as RefOption from "@typed/fx/RefOption";
import * as RefResult from "@typed/fx/RefResult";
import * as RefString from "@typed/fx/RefString";
import * as RefStruct from "@typed/fx/RefStruct";
import { RefSubject } from "@typed/fx";
import * as RefTuple from "@typed/fx/RefTuple";
import * as Versioned from "@typed/fx/Versioned";
import { Effect, Option, Schema } from "effect";
import type * as Cause from "effect/Cause";
import type { Assert, Equal } from "../../__tests__/assert.type-test.js";

// Keep every documented scalar/structural public import executable by TypeScript's resolver.
void RefBigDecimal.make;
void RefBigInt.make;
void RefBoolean.make;
void RefCause.make;
void RefDateTime.make;
void RefDuration.make;
void RefOption.make;
void RefResult.make;
void RefString.make;
void RefStruct.make;
void RefTuple.make;

const _observableUpdate = Effect.scoped(
  Effect.gen(function* () {
    const count = yield* RefSubject.make(0);
    yield* Effect.forkScoped(Fx.observe(count, () => Effect.void));
    return yield* RefSubject.increment(count);
  }),
);

const _namedHydration = Effect.scoped(
  Effect.gen(function* () {
    const count = yield* Hydration.hydrate(Schema.FiniteFromString, 0, { name: "count" });
    yield* RefSubject.update(count, (value) => value + 1);
    return yield* count[Hydration.HydrationRefTypeId].toAttributes;
  }),
);

const _groupedHydration = Effect.scoped(
  Effect.gen(function* () {
    const count = yield* Hydration.hydrate(Schema.Finite, 0);
    const status = yield* Hydration.hydrate(Schema.String, "ready");
    return yield* Hydration.hydrateAll(count, status)[Hydration.HydrationRefTypeId].toAttributes;
  }),
);

class Status extends Versioned.Service<Status, never, string, never, string>()("example/Status") {}

const _statusLayer = Status.make(Effect.succeed(1), Fx.succeed("ready"), Effect.succeed("ready"));

void _observableUpdate;
void _namedHydration;
void _groupedHydration;
void _statusLayer;

declare const computedObject: RefSubject.Computed<{ readonly name: string }, "source-error">;
declare const filteredObject: RefSubject.Filtered<{ readonly name: string }, "source-error">;

const computedName = RefSubject.proxy(computedObject).name;
const filteredName = RefSubject.proxy(filteredObject).name;
const computedMapped = RefSubject.mapEffect(computedObject, (value) => Effect.succeed(value.name));
const filteredMapped = RefSubject.mapEffect(filteredObject, (value) => Effect.succeed(value.name));
const fallback = RefSubject.getOrElse(
  RefSubject.map(computedObject, () => Option.none<string>()),
  () => "anonymous",
);

type _ComputedProxyErrors = Assert<Equal<Effect.Error<typeof computedName>, "source-error">>;
type _FilteredProxyErrors = Assert<
  Equal<Effect.Error<typeof filteredName>, "source-error" | Cause.NoSuchElementError>
>;
type _ComputedMapEffectErrors = Assert<Equal<Effect.Error<typeof computedMapped>, "source-error">>;
type _FilteredMapEffectErrors = Assert<
  Equal<Effect.Error<typeof filteredMapped>, "source-error" | Cause.NoSuchElementError>
>;
type _FallbackErrors = Assert<Equal<Effect.Error<typeof fallback>, "source-error">>;
