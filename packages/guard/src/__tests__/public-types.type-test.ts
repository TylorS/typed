import {
  addTag,
  type AnyInput,
  type AnyOutput,
  bind,
  bindTo,
  catch as catch_,
  catchAll,
  catchCause,
  catchTag,
  decode,
  encode,
  filter,
  Guard,
  liftPredicate,
  let as let_,
  mapEffect,
  provide,
  provideService,
  provideServiceEffect,
  type AsGuard,
} from "@typed/guard";
import type * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type Input = { readonly Input: unique symbol };
type Output = { readonly Output: unique symbol };
type GuardError = { readonly _tag: "GuardError" };
type GuardService = { readonly GuardService: unique symbol };

declare const directGuard: Guard<Input, Output, GuardError, GuardService>;
declare const guardAdapter: AsGuard<Input, Output, GuardError, GuardService>;

const letDataFirst: Guard<Input, Output & { readonly phase: "ready" }, GuardError, GuardService> =
  let_(guardAdapter, "phase", "ready" as const);
const letDataLast: Guard<Input, Output & { readonly phase: "ready" }, GuardError, GuardService> =
  let_("phase", "ready" as const)(guardAdapter);

void letDataFirst;
void letDataLast;

type _DirectInput = Assert<Equal<Guard.Input<typeof directGuard>, Input>>;
type _DirectOutput = Assert<Equal<Guard.Output<typeof directGuard>, Output>>;
type _DirectError = Assert<Equal<Guard.Error<typeof directGuard>, GuardError>>;
type _DirectServices = Assert<Equal<Guard.Services<typeof directGuard>, GuardService>>;

type _AdapterInput = Assert<Equal<Guard.Input<typeof guardAdapter>, Input>>;
type _AdapterOutput = Assert<Equal<Guard.Output<typeof guardAdapter>, Output>>;
type _AdapterError = Assert<Equal<Guard.Error<typeof guardAdapter>, GuardError>>;
type _AdapterServices = Assert<Equal<Guard.Services<typeof guardAdapter>, GuardService>>;

type Refined = { readonly kind: "refined"; readonly value: string };
type Other = { readonly kind: "other"; readonly value: number };
type Candidate = Refined | Other;

declare const candidateGuard: Guard<Input, Candidate, GuardError, GuardService>;

const isRefined = (candidate: Candidate): candidate is Refined => candidate.kind === "refined";
const refinedGuard = liftPredicate(isRefined);
const predicateGuard = liftPredicate(
  (candidate: Candidate): boolean => candidate.kind === "refined",
);
const filteredDataFirst = filter(candidateGuard, isRefined);
const filteredDataLast = filter(isRefined)(candidateGuard);

type _RefinedInput = Assert<Equal<Guard.Input<typeof refinedGuard>, Candidate>>;
type _RefinedOutput = Assert<Equal<Guard.Output<typeof refinedGuard>, Refined>>;
type _PredicateOutput = Assert<Equal<Guard.Output<typeof predicateGuard>, Candidate>>;
type _FilterDataFirst = Assert<
  Equal<typeof filteredDataFirst, Guard<Input, Refined, GuardError, GuardService>>
>;
type _FilterDataLast = Assert<Equal<typeof filteredDataLast, typeof filteredDataFirst>>;

declare const symbolCandidate: unique symbol;
type FirstInput = { readonly firstInput: string };
type SecondInput = { readonly secondInput: number };
type FirstOutput = { readonly firstOutput: string };
type SecondOutput = { readonly secondOutput: number };
type CandidateMap = {
  readonly first: Guard<FirstInput, FirstOutput>;
  readonly [symbolCandidate]: Guard<SecondInput, SecondOutput>;
};
type _AnyInput = Assert<Equal<AnyInput<CandidateMap>, FirstInput & SecondInput>>;
type _AnyOutput = Assert<
  Equal<
    AnyOutput<CandidateMap>,
    | { readonly _tag: "first"; readonly value: FirstOutput }
    | { readonly _tag: typeof symbolCandidate; readonly value: SecondOutput }
  >
>;

const NumberFromString = Schema.FiniteFromString;

type UpstreamError = { readonly _tag: "UpstreamError" };
type UpstreamService = { readonly UpstreamService: unique symbol };
type DecodeExpected = Guard<
  unknown,
  number,
  UpstreamError | Schema.SchemaError,
  UpstreamService | (typeof NumberFromString)["DecodingServices"]
>;
type EncodeExpected = Guard<
  unknown,
  string,
  UpstreamError | Schema.SchemaError,
  UpstreamService | (typeof NumberFromString)["EncodingServices"]
>;

declare const encodedGuard: Guard<unknown, string, UpstreamError, UpstreamService>;
declare const decodedGuard: Guard<unknown, number, UpstreamError, UpstreamService>;

const decodedDataFirst: DecodeExpected = decode(encodedGuard, NumberFromString);
const decodedDataLast: DecodeExpected = decode(NumberFromString)(encodedGuard);
const encodedDataFirst: EncodeExpected = encode(decodedGuard, NumberFromString);
const encodedDataLast: EncodeExpected = encode(NumberFromString)(decodedGuard);

type _DecodeFormsEquivalent = Assert<Equal<typeof decodedDataFirst, typeof decodedDataLast>>;
type _EncodeFormsEquivalent = Assert<Equal<typeof encodedDataFirst, typeof encodedDataLast>>;

// @ts-expect-error decode consumes the schema's encoded representation
decode(decodedGuard, NumberFromString);
// @ts-expect-error curried decode consumes the schema's encoded representation
decode(NumberFromString)(decodedGuard);
// @ts-expect-error encode consumes the schema's decoded representation
encode(encodedGuard, NumberFromString);
// @ts-expect-error curried encode consumes the schema's decoded representation
encode(NumberFromString)(encodedGuard);

declare const primitiveGuard: Guard<unknown, number, UpstreamError, UpstreamService>;
declare const arrayGuard: Guard<unknown, ReadonlyArray<number>, UpstreamError, UpstreamService>;
declare const recordGuard: Guard<
  unknown,
  { readonly value: number },
  UpstreamError,
  UpstreamService
>;
declare const recordToString: Guard<{ readonly value: number }, string>;
declare const symbolKey: unique symbol;
declare const symbolRecordGuard: Guard<unknown, { readonly [symbolKey]: number }>;
declare const unionRecordGuard: Guard<
  unknown,
  { readonly value: number } | { readonly other: number }
>;
declare const unionToString: Guard<{ readonly value: number } | { readonly other: number }, string>;

const namedRecord = bindTo(primitiveGuard, "value");
const extendedRecord: Guard<
  unknown,
  { value: number } & { phase: "ready" },
  UpstreamError,
  UpstreamService
> = let_(namedRecord, "phase", "ready" as const);
const taggedRecord: Guard<
  unknown,
  { readonly value: number } & { readonly _tag: "Ready" },
  UpstreamError,
  UpstreamService
> = addTag(recordGuard, "Ready" as const);
const boundRecord: Guard<
  unknown,
  { readonly value: number } & { label: string },
  UpstreamError,
  UpstreamService
> = bind(recordGuard, "label", recordToString);

let_("phase", "ready" as const)(recordGuard);
addTag("Ready" as const)(recordGuard);
bind("label", recordToString)(recordGuard);

// @ts-expect-error let requires an object output
let_(primitiveGuard, "phase", "ready");
// @ts-expect-error addTag requires an object output
addTag(primitiveGuard, "Number");
// @ts-expect-error bind requires an object output
bind(primitiveGuard, "label", primitiveGuard);
// @ts-expect-error let requires a record output, not an array
let_(arrayGuard, "phase", "ready");
// @ts-expect-error addTag requires a record output, not an array
addTag(arrayGuard, "Numbers");
// @ts-expect-error bind requires a record output, not an array
bind(arrayGuard, "label", primitiveGuard);
// @ts-expect-error let cannot replace an existing key
let_(recordGuard, "value", 1);
// @ts-expect-error curried let cannot replace an existing key
let_("value", 1)(recordGuard);
// @ts-expect-error addTag cannot replace an existing _tag
addTag(taggedRecord, "Again");
// @ts-expect-error curried addTag cannot replace an existing _tag
addTag("Again")(taggedRecord);
// @ts-expect-error bind cannot replace an existing key
bind(recordGuard, "value", recordToString);
// @ts-expect-error curried bind cannot replace an existing key
bind("value", recordToString)(recordGuard);
// @ts-expect-error let cannot replace a symbol key
let_(symbolRecordGuard, symbolKey, 1);
// @ts-expect-error a key present in any successful output variant is a collision
let_(unionRecordGuard, "value", 1);
// @ts-expect-error bind rejects a key present in any successful output variant
bind(unionRecordGuard, "value", unionToString);

void [extendedRecord, taggedRecord, boundRecord];

type BadError = { readonly _tag: "BadError" };
type OtherError = { readonly _tag: "OtherError" };
type ThirdError = { readonly _tag: "ThirdError" };
type RecoveryError = { readonly _tag: "RecoveryError" };
type ProvidedService = { readonly ProvidedService: unique symbol };
type RemainingService = { readonly RemainingService: unique symbol };
type RecoveryService = { readonly RecoveryService: unique symbol };
type LayerService = { readonly LayerService: unique symbol };
type Recovered = { readonly Recovered: unique symbol };

declare const channelGuard: Guard<
  Input,
  Output,
  BadError | OtherError,
  ProvidedService | RemainingService
>;
declare const recovery: Effect.Effect<Recovered, RecoveryError, RecoveryService>;

type RecoveredExpected = Guard<
  Input,
  Output | Recovered,
  RecoveryError,
  ProvidedService | RemainingService | RecoveryService
>;
const caughtAllDataFirst: RecoveredExpected = catchAll(channelGuard, () => recovery);
const caughtAllDataLast: RecoveredExpected = catchAll(() => recovery)(channelGuard);
const caughtAlias: RecoveredExpected = catch_(channelGuard, () => recovery);
const caughtCause: RecoveredExpected = catchCause(channelGuard, () => recovery);

type TaggedExpected = Guard<
  Input,
  Output | Recovered,
  OtherError | RecoveryError,
  ProvidedService | RemainingService | RecoveryService
>;
const caughtTagDataFirst: TaggedExpected = catchTag(channelGuard, "BadError", () => recovery);
declare const multiTagGuard: Guard<
  Input,
  Output,
  BadError | OtherError | ThirdError,
  ProvidedService | RemainingService
>;
type MultiTagExpected = Guard<
  Input,
  Output | Recovered,
  ThirdError | RecoveryError,
  ProvidedService | RemainingService | RecoveryService
>;
const caughtTags: MultiTagExpected = catchTag(
  multiTagGuard,
  ["BadError", "OtherError"],
  () => recovery,
);

type MappedExpected = Guard<
  Input,
  Recovered,
  BadError | OtherError | RecoveryError,
  ProvidedService | RemainingService | RecoveryService
>;
const mappedEffectDataFirst: MappedExpected = mapEffect(channelGuard, () => recovery);
const mappedEffectDataLast: MappedExpected = mapEffect(() => recovery)(channelGuard);

declare const context: Context.Context<ProvidedService>;
declare const layer: Layer.Layer<ProvidedService, RecoveryError, LayerService>;
type ContextProvidedExpected = Guard<Input, Output, BadError | OtherError, RemainingService>;
type LayerProvidedExpected = Guard<
  Input,
  Output,
  BadError | OtherError | RecoveryError,
  RemainingService | LayerService
>;
const contextProvidedDataFirst: ContextProvidedExpected = provide(channelGuard, context);
const contextProvidedDataLast: ContextProvidedExpected = provide(context)(channelGuard);
const layerProvidedDataFirst: LayerProvidedExpected = provide(channelGuard, layer);
const layerProvidedDataLast: LayerProvidedExpected = provide(layer)(channelGuard);

type ServiceShape = { readonly value: number };
declare const serviceTag: Context.Service<ProvidedService, ServiceShape>;
declare const serviceShape: ServiceShape;
const serviceProvidedDataFirst: ContextProvidedExpected = provideService(
  channelGuard,
  serviceTag,
  serviceShape,
);
const serviceProvidedDataLast: ContextProvidedExpected = provideService(
  serviceTag,
  serviceShape,
)(channelGuard);

type ServiceEffectExpected = Guard<
  Input,
  Output,
  BadError | OtherError | RecoveryError,
  RemainingService | RecoveryService
>;
declare const serviceEffect: Effect.Effect<ServiceShape, RecoveryError, RecoveryService>;
const serviceEffectDataFirst: ServiceEffectExpected = provideServiceEffect(
  channelGuard,
  serviceTag,
  serviceEffect,
);
const serviceEffectDataLast: ServiceEffectExpected = provideServiceEffect(
  serviceTag,
  serviceEffect,
)(channelGuard);

void [
  caughtAllDataFirst,
  caughtAllDataLast,
  caughtAlias,
  caughtCause,
  caughtTagDataFirst,
  caughtTags,
  mappedEffectDataFirst,
  mappedEffectDataLast,
  contextProvidedDataFirst,
  contextProvidedDataLast,
  layerProvidedDataFirst,
  layerProvidedDataLast,
  serviceProvidedDataFirst,
  serviceProvidedDataLast,
  serviceEffectDataFirst,
  serviceEffectDataLast,
];
