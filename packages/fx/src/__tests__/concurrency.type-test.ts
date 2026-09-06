import { Fx } from "@typed/fx";
import type * as FxType from "@typed/fx/Fx";
import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Input = { readonly Input: unique symbol };
type Output = { readonly Output: unique symbol };
type SourceError = { readonly SourceError: unique symbol };
type MappedError = { readonly MappedError: unique symbol };
type SourceService = { readonly SourceService: unique symbol };
type MappedService = { readonly MappedService: unique symbol };

declare const source: FxType.Fx<Input, SourceError, SourceService>;
declare const mappedFx: FxType.Fx<Output, MappedError, MappedService>;
declare const mappedEffect: Effect.Effect<Output, MappedError, MappedService>;

const flatMapDirect = Fx.flatMapConcurrently(source, (_): typeof mappedFx => mappedFx, 2);
const flatMapCurried = Fx.flatMapConcurrently((_: Input): typeof mappedFx => mappedFx, 2)(source);
const effectDirect = Fx.flatMapConcurrentlyEffect(
  source,
  (_): typeof mappedEffect => mappedEffect,
  2,
);
const effectCurried = Fx.flatMapConcurrentlyEffect(
  (_: Input): typeof mappedEffect => mappedEffect,
  2,
)(source);
const concatDirect = Fx.concatMap(source, (_): typeof mappedFx => mappedFx);
const concatCurried = Fx.concatMap((_: Input): typeof mappedFx => mappedFx)(source);
const concatEffectDirect = Fx.concatMapEffect(source, (_): typeof mappedEffect => mappedEffect);
const concatEffectCurried = Fx.concatMapEffect((_: Input): typeof mappedEffect => mappedEffect)(
  source,
);

type Expected = FxType.Fx<
  Output,
  SourceError | MappedError | Cause.IllegalArgumentError,
  SourceService | MappedService | Scope.Scope
>;

type _FlatMapDirect = Assert<Equal<typeof flatMapDirect, Expected>>;
type _FlatMapCurried = Assert<Equal<typeof flatMapCurried, Expected>>;
type _EffectDirect = Assert<Equal<typeof effectDirect, Expected>>;
type _EffectCurried = Assert<Equal<typeof effectCurried, Expected>>;

type ConcatExpected = FxType.Fx<
  Output,
  SourceError | MappedError,
  SourceService | MappedService | Scope.Scope
>;

type _ConcatDirect = Assert<Equal<typeof concatDirect, ConcatExpected>>;
type _ConcatCurried = Assert<Equal<typeof concatCurried, ConcatExpected>>;
type _ConcatEffectDirect = Assert<Equal<typeof concatEffectDirect, ConcatExpected>>;
type _ConcatEffectCurried = Assert<Equal<typeof concatEffectCurried, ConcatExpected>>;
