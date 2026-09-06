import { Versioned } from "@typed/fx";
import type * as Fx from "@typed/fx/Fx";
import type * as Effect from "effect/Effect";
import type { Assert, Equal } from "./assert.type-test.js";

type VersionR = { readonly VersionR: unique symbol };
type VersionE = { readonly VersionE: unique symbol };
type FxA = { readonly FxA: unique symbol };
type FxE = { readonly FxE: unique symbol };
type FxR = { readonly FxR: unique symbol };
type SampleA = { readonly SampleA: unique symbol };
type SampleE = { readonly SampleE: unique symbol };
type SampleR = { readonly SampleR: unique symbol };

declare const value: Versioned.Versioned<
  VersionR,
  VersionE,
  FxA,
  FxE,
  FxR,
  SampleA,
  SampleE,
  SampleR
>;

type Unified = Versioned.Versioned.Unify<typeof value>;

type _UnifyVersionContext = Assert<Equal<Versioned.Versioned.VersionContext<Unified>, VersionR>>;
type _UnifyVersionError = Assert<Equal<Versioned.Versioned.VersionError<Unified>, VersionE>>;
type _UnifyFxValue = Assert<Equal<Fx.Success<Unified>, FxA>>;
type _UnifyFxError = Assert<Equal<Fx.Error<Unified>, FxE>>;
type _UnifyFxServices = Assert<Equal<Fx.Services<Unified>, FxR>>;
type _UnifyEffectValue = Assert<Equal<Effect.Success<Unified>, SampleA>>;
type _UnifyEffectError = Assert<Equal<Effect.Error<Unified>, SampleE>>;
type _UnifyEffectServices = Assert<Equal<Effect.Services<Unified>, SampleR>>;

type VersionR1 = { readonly VersionR1: unique symbol };
type VersionE1 = { readonly VersionE1: unique symbol };
type FxA1 = { readonly FxA1: unique symbol };
type FxE1 = { readonly FxE1: unique symbol };
type FxR1 = { readonly FxR1: unique symbol };
type SampleA1 = { readonly SampleA1: unique symbol };
type SampleE1 = { readonly SampleE1: unique symbol };
type SampleR1 = { readonly SampleR1: unique symbol };
type VersionR2 = { readonly VersionR2: unique symbol };
type VersionE2 = { readonly VersionE2: unique symbol };
type FxA2 = { readonly FxA2: unique symbol };
type FxE2 = { readonly FxE2: unique symbol };
type FxR2 = { readonly FxR2: unique symbol };
type SampleA2 = { readonly SampleA2: unique symbol };
type SampleE2 = { readonly SampleE2: unique symbol };
type SampleR2 = { readonly SampleR2: unique symbol };

declare const left: Versioned.Versioned<
  VersionR1,
  VersionE1,
  FxA1,
  FxE1,
  FxR1,
  SampleA1,
  SampleE1,
  SampleR1
>;
declare const right: Versioned.Versioned<
  VersionR2,
  VersionE2,
  FxA2,
  FxE2,
  FxR2,
  SampleA2,
  SampleE2,
  SampleR2
>;

const tuple = Versioned.tuple([left, right] as const);

type _TupleVersionContext = Assert<
  Equal<Versioned.Versioned.VersionContext<typeof tuple>, VersionR1 | VersionR2>
>;
type _TupleVersionError = Assert<
  Equal<Versioned.Versioned.VersionError<typeof tuple>, VersionE1 | VersionE2>
>;
type _TupleFxValue = Assert<Equal<Fx.Success<typeof tuple>, readonly [FxA1, FxA2]>>;
type _TupleFxError = Assert<Equal<Fx.Error<typeof tuple>, FxE1 | FxE2>>;
type _TupleFxServices = Assert<Equal<Fx.Services<typeof tuple>, FxR1 | FxR2>>;
type _TupleEffectValue = Assert<Equal<Effect.Success<typeof tuple>, readonly [SampleA1, SampleA2]>>;
type _TupleEffectError = Assert<Equal<Effect.Error<typeof tuple>, SampleE1 | SampleE2>>;
type _TupleEffectServices = Assert<Equal<Effect.Services<typeof tuple>, SampleR1 | SampleR2>>;
