/** @effect-diagnostics missingEffectContext:skip-file */
import type { RandomValues } from "@typed/id/RandomValues";
import { Effect, Scope } from "effect";
import { expectTypeOf } from "vitest";
import { rootIdentity } from "../RootIdentity.js";

const identity = rootIdentity();
expectTypeOf<Effect.Services<typeof identity>>().toEqualTypeOf<RandomValues | Scope.Scope>();
// @ts-expect-error Running a scoped identity still requires the caller's RandomValues service.
Effect.runPromise(Effect.scoped(identity));
