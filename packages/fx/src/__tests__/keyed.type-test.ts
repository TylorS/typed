import { Fx } from "@typed/fx";
import type * as FxType from "@typed/fx/Fx";
import type * as Cause from "effect/Cause";
import type * as Scope from "effect/Scope";
import type { Assert, Equal } from "./assert.type-test.js";

type Input = { readonly id: string };
type Output = { readonly Output: unique symbol };
type SourceError = { readonly SourceError: unique symbol };
type MappedError = { readonly MappedError: unique symbol };
type SourceService = { readonly SourceService: unique symbol };
type MappedService = { readonly MappedService: unique symbol };

declare const source: FxType.Fx<ReadonlyArray<Input>, SourceError, SourceService>;
declare const mapped: FxType.Fx<Output, MappedError, MappedService | Scope.Scope>;

const options: FxType.KeyedOptions<Input, string, Output, MappedError, MappedService> = {
  getKey: (value) => value.id,
  onValue: () => mapped,
};

const direct = Fx.keyed(source, options);
const curried = Fx.keyed(options)(source);

type Expected = FxType.Fx<
  ReadonlyArray<Output>,
  SourceError | MappedError | Cause.IllegalArgumentError,
  SourceService | MappedService | Scope.Scope
>;

type _Direct = Assert<Equal<typeof direct, Expected>>;
type _Curried = Assert<Equal<typeof curried, Expected>>;
