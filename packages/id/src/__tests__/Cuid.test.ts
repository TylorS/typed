import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { type CuidSeed, CuidState, cuid, isCuid } from "../Cuid.js";
import { DateTimes } from "../DateTimes.js";
import { seededRandomValues } from "./helpers.js";

const fixedSeed = (random = Uint8Array.from({ length: 32 }, (_, index) => index)): CuidSeed => ({
  timestamp: 1_700_000_000_000,
  counter: 42,
  fingerprint: "test",
  random: random as CuidSeed["random"],
});

const generate = (seed: CuidSeed) =>
  Effect.runPromise(
    Effect.provideService(cuid, CuidState, CuidState.of({ next: Effect.succeed(seed) })),
  );

const stateLayer = (seed: string) =>
  Layer.effect(CuidState, CuidState.make("test")).pipe(
    Layer.provide([DateTimes.Fixed(1_700_000_000_000), seededRandomValues(seed)]),
  );

describe("cuid", () => {
  it("matches the domain-separated fixed vector", async () => {
    expect(await generate(fixedSeed())).toBe("eplgqy5n51juw5n0bcvv7dtl");
  });

  it("uses every byte of the 32-byte random input", async () => {
    const expected = await generate(fixedSeed());

    for (let index = 0; index < 32; index++) {
      const random = Uint8Array.from({ length: 32 }, (_, byteIndex) => byteIndex);
      random[index] ^= 0xff;
      expect(await generate(fixedSeed(random))).not.toBe(expected);
    }
  });

  it("distinguishes equal prefixes with different random tails", async () => {
    const zeros = new Uint8Array(32);
    const ones = new Uint8Array(32);
    ones.fill(0xff, 5);

    expect(await generate(fixedSeed(zeros))).not.toBe(await generate(fixedSeed(ones)));
  });

  it("produces the branded 24-character shape", async () => {
    const id = await generate(fixedSeed());

    expect(id).toMatch(/^[a-z][0-9a-z]{23}$/);
    expect(isCuid(id)).toBe(true);
  });
});

describe("CuidState", () => {
  it("increments the counter within one layer", async () => {
    const program = Effect.gen(function* () {
      const first = yield* CuidState.next;
      const second = yield* CuidState.next;
      return [first.counter, second.counter] as const;
    });

    const [first, second] = await Effect.runPromise(Effect.provide(program, stateLayer("same")));
    expect(second).toBe(first + 1);
  });

  it("produces distinct first IDs from independently seeded layers", async () => {
    const first = await Effect.runPromise(Effect.provide(cuid, stateLayer("first")));
    const second = await Effect.runPromise(Effect.provide(cuid, stateLayer("second")));

    expect(second).not.toBe(first);
  });
});
