import { RefArray, RefSubject } from "@typed/fx";
import * as RefResult from "@typed/fx/RefResult";
import type * as Fx from "@typed/fx/Fx";
import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Result from "effect/Result";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Value = { readonly Value: unique symbol };
type ResultError = { readonly ResultError: unique symbol };
type OperationalError = { readonly OperationalError: unique symbol };
type Service = { readonly Service: unique symbol };
type Mapped = { readonly Mapped: unique symbol };
type MappedResultError = { readonly MappedResultError: unique symbol };
type InnerResultError = { readonly InnerResultError: unique symbol };

declare const value: Value;
declare const resultError: ResultError;
declare const mapped: Mapped;
declare const mappedResultError: MappedResultError;
declare const computedOption: RefSubject.Computed<Option.Option<Value>, OperationalError, Service>;
declare const filteredOption: RefSubject.Filtered<Option.Option<Value>, OperationalError, Service>;
declare const refResult: RefResult.RefResult<Value, ResultError, OperationalError, Service>;

const array = RefArray.make([1, 2, 3]);
const emptyStruct = RefSubject.struct({});
const emptyTuple = RefSubject.tuple([]);

type _ArrayError = Assert<Equal<Effect.Error<typeof array>, never>>;
type _ArrayServices = Assert<Equal<Effect.Services<typeof array>, Scope.Scope>>;
type _EmptyStruct = Assert<Equal<typeof emptyStruct, RefSubject.RefSubject<{}, never, never>>>;
type _EmptyTuple = Assert<
  Equal<typeof emptyTuple, RefSubject.RefSubject<readonly [], never, never>>
>;

const compactComputed = RefSubject.compact(computedOption);
const compactFiltered = RefSubject.compact(filteredOption);

type CompactExpected = RefSubject.Filtered<Value, OperationalError, Service>;
type _CompactComputed = Assert<Equal<typeof compactComputed, CompactExpected>>;
type _CompactFiltered = Assert<Equal<typeof compactFiltered, CompactExpected>>;
type _CompactComputedFxServices = Assert<
  Equal<Fx.Services<typeof compactComputed>, Service | Scope.Scope>
>;
type _CompactFilteredFxServices = Assert<
  Equal<Fx.Services<typeof compactFiltered>, Service | Scope.Scope>
>;

type SetExpected = Effect.Effect<Result.Result<Value, ResultError>, OperationalError, Service>;

const setSuccessDirect = RefResult.setSuccess(refResult, value);
const setSuccessCurried = RefResult.setSuccess(value)(refResult);
const setFailureDirect = RefResult.setFailure(refResult, resultError);
const setFailureCurried = RefResult.setFailure(resultError)(refResult);

type _SetSuccessDirect = Assert<Equal<typeof setSuccessDirect, SetExpected>>;
type _SetSuccessCurried = Assert<Equal<typeof setSuccessCurried, SetExpected>>;
type _SetFailureDirect = Assert<Equal<typeof setFailureDirect, SetExpected>>;
type _SetFailureCurried = Assert<Equal<typeof setFailureCurried, SetExpected>>;

type MapExpected = RefSubject.Computed<
  Result.Result<Mapped, ResultError>,
  OperationalError,
  Service
>;

const mapDirect = RefResult.map(refResult, (_): Mapped => mapped);
const mapCurried = RefResult.map((_: Value): Mapped => mapped)(refResult);

type _MapDirect = Assert<Equal<typeof mapDirect, MapExpected>>;
type _MapCurried = Assert<Equal<typeof mapCurried, MapExpected>>;

type MapErrorExpected = RefSubject.Computed<
  Result.Result<Value, MappedResultError>,
  OperationalError,
  Service
>;

const mapErrorDirect = RefResult.mapError(refResult, (_): MappedResultError => mappedResultError);
const mapErrorCurried = RefResult.mapError(
  (_: ResultError): MappedResultError => mappedResultError,
)(refResult);

type _MapErrorDirect = Assert<Equal<typeof mapErrorDirect, MapErrorExpected>>;
type _MapErrorCurried = Assert<Equal<typeof mapErrorCurried, MapErrorExpected>>;

type FlatMapExpected = RefSubject.Computed<
  Result.Result<Mapped, ResultError | InnerResultError>,
  OperationalError,
  Service
>;

declare const innerResult: Result.Result<Mapped, InnerResultError>;

const flatMapDirect = RefResult.flatMap(refResult, (_): typeof innerResult => innerResult);
const flatMapCurried = RefResult.flatMap((_: Value): typeof innerResult => innerResult)(refResult);

type _FlatMapDirect = Assert<Equal<typeof flatMapDirect, FlatMapExpected>>;
type _FlatMapCurried = Assert<Equal<typeof flatMapCurried, FlatMapExpected>>;

type MatchExpected = RefSubject.Computed<Mapped, OperationalError, Service>;

const matchOptions = {
  onSuccess: (_: Value): Mapped => mapped,
  onFailure: (_: ResultError): Mapped => mapped,
};
const matchDirect = RefResult.match(refResult, matchOptions);
const matchCurried = RefResult.match(matchOptions)(refResult);

type _MatchDirect = Assert<Equal<typeof matchDirect, MatchExpected>>;
type _MatchCurried = Assert<Equal<typeof matchCurried, MatchExpected>>;
