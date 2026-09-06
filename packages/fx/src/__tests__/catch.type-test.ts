import * as Fx from "@typed/fx/Fx";
import { Data } from "effect";
import type { Assert, Equal } from "./assert.type-test.js";

class ErrorA extends Data.TaggedError("A")<{}> {}
class ErrorB extends Data.TaggedError("B")<{}> {}
type RemainingError = { readonly _tag: "RemainingError" };
type RecoveryErrorA = { readonly _tag: "RecoveryErrorA" };
type RecoveryErrorB = { readonly _tag: "RecoveryErrorB" };
type SourceService = { readonly SourceService: unique symbol };
type RecoveryServiceA = { readonly RecoveryServiceA: unique symbol };
type RecoveryServiceB = { readonly RecoveryServiceB: unique symbol };

// eslint-disable-next-line require-yield -- This asserts the yieldless generator contract.
const generatedWithoutYields = Fx.gen(function* () {
  return Fx.succeed(1);
});
// eslint-disable-next-line require-yield -- This asserts the yieldless generator contract.
const generatedScopedWithoutYields = Fx.genScoped(function* () {
  return Fx.succeed(1);
});

type _GenWithoutYieldsError = Assert<Equal<Fx.Error<typeof generatedWithoutYields>, never>>;
type _GenWithoutYieldsServices = Assert<Equal<Fx.Services<typeof generatedWithoutYields>, never>>;
type _GenScopedWithoutYieldsError = Assert<
  Equal<Fx.Error<typeof generatedScopedWithoutYields>, never>
>;
type _GenScopedWithoutYieldsServices = Assert<
  Equal<Fx.Services<typeof generatedScopedWithoutYields>, never>
>;

declare const source: Fx.Fx<number, ErrorA | ErrorB | RemainingError, SourceService>;
declare const recoveryA: Fx.Fx<"a", RecoveryErrorA, RecoveryServiceA>;
declare const recoveryB: Fx.Fx<"b", RecoveryErrorB, RecoveryServiceB>;

const recovered = source.pipe(
  Fx.catchTags({
    A: (_error: ErrorA) => recoveryA,
    B: (_error: ErrorB) => recoveryB,
  }),
);

type _CatchTagsSuccess = Assert<Equal<Fx.Success<typeof recovered>, number | "a" | "b">>;
type _CatchTagsError = Assert<
  Equal<Fx.Error<typeof recovered>, RemainingError | RecoveryErrorA | RecoveryErrorB>
>;
type _CatchTagsServices = Assert<
  Equal<Fx.Services<typeof recovered>, SourceService | RecoveryServiceA | RecoveryServiceB>
>;
