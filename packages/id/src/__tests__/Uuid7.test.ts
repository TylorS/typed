import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { DateTimes } from "../DateTimes.js";
import { RandomValues } from "../RandomValues.js";
import { uuid7, type Uuid7Seed, Uuid7State } from "../Uuid7.js";
import { expectIllegalArgument } from "./helpers.js";

const decode = (uuid: string) => {
  const bytes = Uint8Array.from(uuid.replaceAll("-", "").match(/.{2}/g)!, (byte) =>
    Number.parseInt(byte, 16),
  );
  let timestamp = 0;
  for (const byte of bytes.subarray(0, 6)) timestamp = timestamp * 0x100 + byte;

  const sequence =
    (((bytes[6] & 0x0f) << 28) |
      (bytes[7] << 20) |
      ((bytes[8] & 0x3f) << 14) |
      (bytes[9] << 6) |
      (bytes[10] >>> 2)) >>>
    0;
  let trailingRandom = BigInt(bytes[10] & 0x03);
  for (const byte of bytes.subarray(11)) trailingRandom = (trailingRandom << 8n) | BigInt(byte);

  return { sequence, timestamp, trailingRandom };
};

type ExactBytes<N extends number> = Uint8Array & { readonly length: N };

const layer = (times: ReadonlyArray<number>, source: Uint8Array) => {
  let call = 0;
  const now = Effect.sync(() => times[Math.min(call++, times.length - 1)]!);
  const dateTimes = Layer.succeed(
    DateTimes,
    DateTimes.of({
      now,
      date: Effect.map(now, (timestamp) => new Date(timestamp)),
    }),
  );
  const randomValues = Layer.succeed(
    RandomValues,
    RandomValues.of(<const N extends number>(length: N) =>
      Effect.succeed(source.slice(0, length) as ExactBytes<N>),
    ),
  );

  return Layer.effect(Uuid7State, Uuid7State.make).pipe(Layer.provide([dateTimes, randomValues]));
};

const generate = (times: ReadonlyArray<number>, source: Uint8Array) =>
  Effect.runPromise(
    Effect.provide(
      Effect.gen(function* () {
        const values = [];
        for (let index = 0; index < times.length; index++) values.push(yield* uuid7);
        return values;
      }),
      layer(times, source),
    ),
  );

const generateSeeds = (times: ReadonlyArray<number>, source: Uint8Array) =>
  Effect.runPromise(
    Effect.provide(
      Effect.gen(function* () {
        const seeds: Array<Uuid7Seed> = [];
        for (let index = 0; index < times.length; index++) seeds.push(yield* Uuid7State.next);
        return seeds;
      }),
      layer(times, source),
    ),
  );


describe("Uuid7", () => {
  const maximumTimestamp = 2 ** 48 - 1;

  it("seeds the complete unsigned 32-bit sequence", async () => {
    const [value] = await generate([0], new Uint8Array(16).fill(0xff));

    expect(value).toBe("00000000-0000-7fff-bfff-ffffffffffff");
    expect(decode(value!).sequence).toBe(0xffffffff);
    expect(decode(value!).trailingRandom).toBe(2n ** 42n - 1n);
  });

  it.each([
    { byte: 6, sequence: 0x80000000 },
    { byte: 7, sequence: 0x00800000 },
    { byte: 8, sequence: 0x00008000 },
    { byte: 9, sequence: 0x00000080 },
  ])("maps random byte $byte to sequence $sequence", async ({ byte, sequence }) => {
    const source = new Uint8Array(16);
    source[byte] = 0x80;
    const [value] = await generate([0], source);

    expect(decode(value!).sequence).toBe(sequence);
  });

  it("increments the sequence within the same millisecond", async () => {
    const values = await generate([100, 100], new Uint8Array(16));

    expect(values.map(decode)).toEqual([
      { sequence: 0, timestamp: 100, trailingRandom: 0n },
      { sequence: 1, timestamp: 100, trailingRandom: 0n },
    ]);
  });

  it("keeps high-bit state sequences unsigned while incrementing", async () => {
    const source = new Uint8Array(16);
    source[6] = 0x80;
    const seeds = await generateSeeds([100, 100], source);

    expect(seeds.map(({ seq }) => seq)).toEqual([0x80000000, 0x80000001]);
  });

  it("keeps its encoded timestamp monotonic when the clock rolls back", async () => {
    const source = new Uint8Array(16);
    source.set([0x10, 0x20, 0x30, 0x40], 6);
    const values = await generate([100, 99], source);

    expect(values.map(decode)).toEqual([
      { sequence: 0x10203040, timestamp: 100, trailingRandom: 0n },
      { sequence: 0x10203041, timestamp: 100, trailingRandom: 0n },
    ]);
  });

  it("advances the encoded timestamp when the sequence rolls over", async () => {
    const values = await generate([100, 100], new Uint8Array(16).fill(0xff));

    expect(values.map(decode)).toEqual([
      { sequence: 0xffffffff, timestamp: 100, trailingRandom: 2n ** 42n - 1n },
      { sequence: 0, timestamp: 101, trailingRandom: 2n ** 42n - 1n },
    ]);
  });

  it("accepts the complete unsigned 48-bit timestamp range", async () => {
    const [value] = await generate([maximumTimestamp], new Uint8Array(16));

    expect(decode(value!).timestamp).toBe(maximumTimestamp);
  });

  it.each([-1, 2 ** 48, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an unrepresentable timestamp %s",
    async (timestamp) => {
      const exit = await Effect.runPromise(
        Effect.provide(Effect.exit(uuid7), layer([timestamp], new Uint8Array(16))),
      );

      expectIllegalArgument(exit);
    },
  );

  it("rejects invalid time before mutating generator state", async () => {
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const invalid = yield* Effect.exit(uuid7);
          const valid = yield* uuid7;
          return { invalid, valid };
        }),
        layer([2 ** 48, 7], new Uint8Array(16)),
      ),
    );

    expectIllegalArgument(result.invalid);
    expect(decode(result.valid)).toEqual({ sequence: 0, timestamp: 7, trailingRandom: 0n });
  });

  it("rejects sequence rollover beyond the 48-bit timestamp field", async () => {
    const [first, second] = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          return [yield* uuid7, yield* Effect.exit(uuid7)] as const;
        }),
        layer([maximumTimestamp, maximumTimestamp], new Uint8Array(16).fill(0xff)),
      ),
    );

    expect(decode(first).timestamp).toBe(maximumTimestamp);
    expectIllegalArgument(second);
  });
});
