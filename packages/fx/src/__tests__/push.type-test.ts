import { Push } from "@typed/fx";
import type * as Fx from "@typed/fx/Fx";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Input = { readonly Input: unique symbol };
type InputError = { readonly InputError: unique symbol };
type InputService = { readonly InputService: unique symbol };
type Output = { readonly Output: unique symbol };
type OutputError = { readonly OutputError: unique symbol };
type OutputService = { readonly OutputService: unique symbol };
type MappedInput = { readonly MappedInput: unique symbol };
type MappedOutput = { readonly MappedOutput: unique symbol };
type CallbackError = { readonly CallbackError: unique symbol };
type CallbackService = { readonly CallbackService: unique symbol };

declare const input: Input;
declare const outputFx: Fx.Fx<MappedOutput, CallbackError, CallbackService>;
declare const outputEffect: Effect.Effect<MappedOutput, CallbackError, CallbackService>;
declare const push: Push.Push<Input, InputError, InputService, Output, OutputError, OutputService>;

type MapInputExpected = Push.Push<
  MappedInput,
  InputError,
  InputService,
  Output,
  OutputError,
  OutputService
>;
type FilterInputExpected = Push.Push<
  Input,
  InputError,
  InputService,
  Output,
  OutputError,
  OutputService
>;
type FlattenExpected = Push.Push<
  Input,
  InputError,
  InputService,
  MappedOutput,
  OutputError | CallbackError,
  OutputService | CallbackService | Scope.Scope
>;

const mapInputDirect = Push.mapInput(push, (_: MappedInput): Input => input);
const mapInputCurried = Push.mapInput((_: MappedInput): Input => input)(push);
const filterInputDirect = Push.filterInput(push, (_: Input): boolean => true);
const filterInputCurried = Push.filterInput((_: Input): boolean => true)(push);

type _MapInputDirect = Assert<Equal<typeof mapInputDirect, MapInputExpected>>;
type _MapInputCurried = Assert<Equal<typeof mapInputCurried, MapInputExpected>>;
type _FilterInputDirect = Assert<Equal<typeof filterInputDirect, FilterInputExpected>>;
type _FilterInputCurried = Assert<Equal<typeof filterInputCurried, FilterInputExpected>>;

const switchMapDirect = Push.switchMap(push, (_: Output): typeof outputFx => outputFx);
const switchMapCurried = Push.switchMap((_: Output): typeof outputFx => outputFx)(push);
const switchMapEffectDirect = Push.switchMapEffect(
  push,
  (_: Output): typeof outputEffect => outputEffect,
);
const switchMapEffectCurried = Push.switchMapEffect(
  (_: Output): typeof outputEffect => outputEffect,
)(push);
const flatMapEffectDirect = Push.flatMapEffect(
  push,
  (_: Output): typeof outputEffect => outputEffect,
);
const flatMapEffectCurried = Push.flatMapEffect((_: Output): typeof outputEffect => outputEffect)(
  push,
);
const exhaustMapEffectDirect = Push.exhaustMapEffect(
  push,
  (_: Output): typeof outputEffect => outputEffect,
);
const exhaustMapEffectCurried = Push.exhaustMapEffect(
  (_: Output): typeof outputEffect => outputEffect,
)(push);
const exhaustLatestMapEffectDirect = Push.exhaustLatestMapEffect(
  push,
  (_: Output): typeof outputEffect => outputEffect,
);
const exhaustLatestMapEffectCurried = Push.exhaustLatestMapEffect(
  (_: Output): typeof outputEffect => outputEffect,
)(push);

type _SwitchMapDirect = Assert<Equal<typeof switchMapDirect, FlattenExpected>>;
type _SwitchMapCurried = Assert<Equal<typeof switchMapCurried, FlattenExpected>>;
type _SwitchMapEffectDirect = Assert<Equal<typeof switchMapEffectDirect, FlattenExpected>>;
type _SwitchMapEffectCurried = Assert<Equal<typeof switchMapEffectCurried, FlattenExpected>>;
type _FlatMapEffectDirect = Assert<Equal<typeof flatMapEffectDirect, FlattenExpected>>;
type _FlatMapEffectCurried = Assert<Equal<typeof flatMapEffectCurried, FlattenExpected>>;
type _ExhaustMapEffectDirect = Assert<Equal<typeof exhaustMapEffectDirect, FlattenExpected>>;
type _ExhaustMapEffectCurried = Assert<Equal<typeof exhaustMapEffectCurried, FlattenExpected>>;
type _ExhaustLatestMapEffectDirect = Assert<
  Equal<typeof exhaustLatestMapEffectDirect, FlattenExpected>
>;
type _ExhaustLatestMapEffectCurried = Assert<
  Equal<typeof exhaustLatestMapEffectCurried, FlattenExpected>
>;
