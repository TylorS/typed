import { Fx, Subject } from "@typed/fx";
import type { NonEmptyReadonlyArray } from "effect/Array";
import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Value = { readonly Value: unique symbol };
type SourceError = { readonly SourceError: unique symbol };
type SourceService = { readonly SourceService: unique symbol };

declare const source: Fx.Fx<Value, SourceError, SourceService>;

const made = Subject.make<Value>(2);
type _MakeError = Assert<Equal<Effect.Error<typeof made>, Cause.IllegalArgumentError>>;

const replayDirect = Subject.replay(source, 2);
const replayCurried = Subject.replay(2)(source);
type ReplayExpected = Fx.Fx<
  Value,
  SourceError | Cause.IllegalArgumentError,
  SourceService | Scope.Scope
>;
type _ReplayDirect = Assert<Equal<typeof replayDirect, ReplayExpected>>;
type _ReplayCurried = Assert<Equal<typeof replayCurried, ReplayExpected>>;

const groupedDirect = Fx.grouped(source, 2);
const groupedCurried = Fx.grouped(2)(source);
type GroupedExpected = Fx.Fx<
  NonEmptyReadonlyArray<Value>,
  SourceError | Cause.IllegalArgumentError,
  SourceService
>;
type _GroupedDirect = Assert<Equal<typeof groupedDirect, GroupedExpected>>;
type _GroupedCurried = Assert<Equal<typeof groupedCurried, GroupedExpected>>;

const groupedWithinDirect = Fx.groupedWithin(source, 2, "1 second");
const groupedWithinCurried = Fx.groupedWithin(2, "1 second")(source);
type GroupedWithinExpected = Fx.Fx<
  NonEmptyReadonlyArray<Value>,
  SourceError | Cause.IllegalArgumentError,
  SourceService | Scope.Scope
>;
type _GroupedWithinDirect = Assert<Equal<typeof groupedWithinDirect, GroupedWithinExpected>>;
type _GroupedWithinCurried = Assert<Equal<typeof groupedWithinCurried, GroupedWithinExpected>>;
