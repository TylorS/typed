import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Random from "effect/Random";
import { expect } from "vitest";
import { RandomValues } from "../RandomValues.js";

export const expectIllegalArgument = (exit: Exit.Exit<unknown, unknown>) => {
  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    const failure = Cause.findErrorOption(exit.cause);
    expect(failure._tag).toBe("Some");
    if (failure._tag === "Some") {
      expect(Cause.isIllegalArgumentError(failure.value)).toBe(true);
    }
  }
};

export const seededRandomValues = (seed: string | number): Layer.Layer<RandomValues> =>
  Layer.effect(
    RandomValues,
    RandomValues.pipe(Effect.provide(RandomValues.Random), Random.withSeed(seed)),
  );

export const zeroRandomValues: Layer.Layer<RandomValues> = Layer.succeed(
  RandomValues,
  RandomValues.of(
    Effect.fn(<const N extends number>(length: N) =>
      Effect.succeed(new Uint8Array(length) as Uint8Array & { readonly length: N }),
    ),
  ),
);
