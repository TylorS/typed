import { expectTypeOf, it } from "vitest";
import type { Apply, Identity, InputOf, Pipe, TypeFunction } from "../TypeFunction.js";

interface Suffix extends TypeFunction<string> {
  readonly return: `${InputOf<this>}!`;
}

interface Duplicate extends TypeFunction<string> {
  readonly return: `${InputOf<this>}${InputOf<this>}`;
}

it("applies a unary type function while preserving literal input", () => {
  expectTypeOf<Apply<Suffix, "route">>().toEqualTypeOf<"route!">();
  expectTypeOf<Apply<Suffix, 1>>().toBeNever();
});

it("pipes unary type functions and supports identity", () => {
  expectTypeOf<Pipe<"a", Suffix, Duplicate>>().toEqualTypeOf<"a!a!">();
  expectTypeOf<Apply<Identity, "route">>().toEqualTypeOf<"route">();
});
