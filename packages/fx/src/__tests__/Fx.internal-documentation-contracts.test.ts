import * as Effect from "effect/Effect";
import * as Equivalence from "effect/Equivalence";
import * as Exit from "effect/Exit";
import * as MutableRef from "effect/MutableRef";
import * as Option from "effect/Option";
import { describe, expect, it } from "vitest";
import { unsafeMake } from "../Fx/internal/DeferredRef.js";
import { getExitEquivalence } from "../Fx/internal/equivalence.js";
import { RingBuffer } from "../Fx/internal/ring-buffer.js";

describe("Fx internal documentation contracts", () => {
  it("uses a zero-based DeferredRef version and completes only the post-reset gate", () => {
    const current = MutableRef.make<Option.Option<Exit.Exit<number, never>>>(Option.none());
    const ref = unsafeMake(undefined, getExitEquivalence(Equivalence.Number), current);
    const gate = ref.deferred;

    expect(ref.version).toBe(-1);
    expect(ref.done(Exit.succeed(1))).toBe(true);
    expect(ref.version).toBe(0);
    expect(ref.deferred).toBe(gate);

    expect(ref.done(Exit.succeed(2))).toBe(true);
    expect(ref.version).toBe(1);
    expect(ref.deferred).toBe(gate);
    expect(Effect.runSync(ref)).toBe(2);

    expect(ref.done(Exit.succeed(2))).toBe(false);
    expect(ref.version).toBe(1);

    ref.reset();
    expect(ref.version).toBe(-1);
    expect(ref.deferred).not.toBe(gate);
  });

  it("captures RingBuffer forEach size and first callback eagerly, not as a snapshot", () => {
    const buffer = new RingBuffer<number>(2);
    const constructed: Array<number> = [];
    const executed: Array<number> = [];
    buffer.push(1);
    buffer.push(2);

    const replay = buffer.forEach((value) => {
      constructed.push(value);
      return Effect.sync(() => executed.push(value));
    });

    expect(constructed).toEqual([1]);
    buffer.push(3);
    Effect.runSync(replay);

    expect(constructed).toEqual([1, 3]);
    expect(executed).toEqual([1, 3]);
  });
});
