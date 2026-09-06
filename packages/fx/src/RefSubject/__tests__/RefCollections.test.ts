import { describe, expect, it } from "vitest";
import * as Chunk from "effect/Chunk";
import { Effect } from "effect";
import * as HashMap from "effect/HashMap";
import * as HashSet from "effect/HashSet";
import * as PrimaryKey from "effect/PrimaryKey";
import * as Trie from "effect/Trie";
import * as RefChunk from "../RefChunk.js";
import * as RefGraph from "../RefGraph.js";
import * as RefHashMap from "../RefHashMap.js";
import * as RefHashRing from "../RefHashRing.js";
import * as RefHashSet from "../RefHashSet.js";
import * as RefIterable from "../RefIterable.js";
import * as RefRecord from "../RefRecord.js";
import * as RefTrie from "../RefTrie.js";

describe("RefSubject collection modules", () => {
  it("RefChunk supports append and prepend", () =>
    Effect.gen(function* () {
      const ref = yield* RefChunk.make(Chunk.fromIterable([2]));
      yield* RefChunk.prepend(ref, 1);
      yield* RefChunk.append(ref, 3);
      expect(Chunk.toReadonlyArray(yield* ref)).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefRecord supports set and get", () =>
    Effect.gen(function* () {
      const ref = yield* RefRecord.make({ name: "Ada" as string | number, age: 0 });
      yield* RefRecord.set(ref, "age", 36);
      expect(yield* ref).toEqual({ name: "Ada", age: 36 });
      expect(yield* RefRecord.get(ref, "name")).toBe("Ada");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefHashMap supports set and get", () =>
    Effect.gen(function* () {
      const ref = yield* RefHashMap.make(HashMap.empty<string, number>());
      yield* RefHashMap.set(ref, "a", 1);
      expect(yield* RefHashMap.get(ref, "a")).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefHashSet supports add and has", () =>
    Effect.gen(function* () {
      const ref = yield* RefHashSet.make(HashSet.empty<string>());
      yield* RefHashSet.add(ref, "x");
      expect(yield* RefHashSet.has(ref, "x")).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefIterable supports append and take", () =>
    Effect.gen(function* () {
      const ref = yield* RefIterable.make([1, 2]);
      yield* RefIterable.append(ref, 3);
      yield* RefIterable.take(ref, 2);
      expect([...(yield* ref)]).toEqual([1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefTrie supports insert and get", () =>
    Effect.gen(function* () {
      const ref = yield* RefTrie.make(Trie.empty<string>());
      yield* RefTrie.insert(ref, "ab", "value");
      expect(yield* RefTrie.get(ref, "ab")).toBe("value");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefGraph supports directed construction and addNode", () =>
    Effect.gen(function* () {
      const ref = yield* RefGraph.directed<string, number>();
      yield* RefGraph.addNode(ref, "a");
      expect(yield* RefGraph.nodeCount(ref)).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("RefHashRing supports add and has", () =>
    Effect.gen(function* () {
      class RingNode implements PrimaryKey.PrimaryKey {
        constructor(readonly id: string) {}
        [PrimaryKey.symbol](): string {
          return this.id;
        }
      }

      const ref = yield* RefHashRing.empty<RingNode>();
      const node = new RingNode("node-1");
      yield* RefHashRing.add(ref, node);
      expect(yield* RefHashRing.has(ref, node)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
