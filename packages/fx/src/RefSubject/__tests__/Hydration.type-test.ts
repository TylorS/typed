import { Fx, RefSubject } from "@typed/fx";
import type * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { Assert } from "../../__tests__/assert.type-test.js";

type Extends<A, B> = [A] extends [B] ? true : false;

const hydratedEffect = RefSubject.hydrate(Schema.Finite, 1);
declare const hydrated: Effect.Success<typeof hydratedEffect>;

type _Callable = Assert<Extends<typeof hydrated, (...args: ReadonlyArray<any>) => any>>;
type _RefSubject = Assert<Extends<typeof hydrated, RefSubject.RefSubject<number, any, any>>>;
type _HydrationRef = Assert<Extends<typeof hydrated, RefSubject.HydrationRef<any, any>>>;

const _set = RefSubject.set(hydrated, 2);
const _mapped = Fx.map(hydrated, (value) => value + 1);

const _named = RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "count" });

// @ts-expect-error named hydration requires a string-encoded codec
const _invalidNamed = RefSubject.hydrate(Schema.Finite, 1, { name: "count" });
