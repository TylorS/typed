import { Sink, Subject } from "@typed/fx";
import type * as Fx from "@typed/fx/Fx";
import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Not<T extends boolean> = T extends true ? false : true;

type Value = { readonly Value: unique symbol };
type Error = { readonly Error: unique symbol };
type SourceService = { readonly SourceService: unique symbol };
type FailureService = { readonly FailureService: unique symbol };
type SuccessService = { readonly SuccessService: unique symbol };

declare const source: Fx.Fx<Value, Error, SourceService>;
declare const onFailure: (
  cause: Cause.Cause<Error>,
) => Effect.Effect<unknown, never, FailureService>;
declare const onSuccess: (value: Value) => Effect.Effect<unknown, never, SuccessService>;
declare const onSuccessWithFailureService: (
  value: Value,
) => Effect.Effect<unknown, never, FailureService>;

const replayDirect = Subject.replay(source, 2);
const replayCurried = Subject.replay(2)(source);

type ReplayExpected = Fx.Fx<Value, Error | Cause.IllegalArgumentError, SourceService | Scope.Scope>;
type _ReplayDirect = Assert<Equal<typeof replayDirect, ReplayExpected>>;
type _ReplayCurried = Assert<Equal<typeof replayCurried, ReplayExpected>>;
type _ReplayDoesNotDropScope = Assert<Not<Equal<Fx.Services<typeof replayDirect>, SourceService>>>;

const sink = Sink.make(onFailure, onSuccess);

type SinkExpected = Sink.Sink<Value, Error, FailureService | SuccessService>;
type _Sink = Assert<Equal<typeof sink, SinkExpected>>;
type _SinkDoesNotDropFailureService = Assert<
  Not<Equal<Sink.Services<typeof sink>, SuccessService>>
>;
type _SinkDoesNotDropSuccessService = Assert<
  Not<Equal<Sink.Services<typeof sink>, FailureService>>
>;

const explicitlyTypedSink = Sink.make<Value, Error, FailureService>(
  onFailure,
  onSuccessWithFailureService,
);
type _ExplicitGenericCompatibility = Assert<
  Equal<typeof explicitlyTypedSink, Sink.Sink<Value, Error, FailureService>>
>;
