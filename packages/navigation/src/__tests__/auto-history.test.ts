import { IdsTest } from "@typed/id/IdsTest";
import { Effect, Layer } from "effect";
import { assert, describe, it } from "vitest";
import { initialMemory } from "../memory.js";
import { Navigation } from "../Navigation.js";

describe("Navigation.navigate history auto selection", () => {
  it.each([
    {
      name: "replaces when only the query changes",
      from: "https://example.com/products?sort=asc#details",
      to: "https://example.com/products?sort=desc#details",
      expectedEntries: 1,
      preservesKey: true,
    },
    {
      name: "replaces when only the hash changes",
      from: "https://example.com/products?sort=asc#details",
      to: "https://example.com/products?sort=asc#reviews",
      expectedEntries: 1,
      preservesKey: true,
    },
    {
      name: "pushes when the pathname changes",
      from: "https://example.com/products?sort=asc#details",
      to: "https://example.com/cart?sort=asc#details",
      expectedEntries: 2,
      preservesKey: false,
    },
  ])("$name", ({ expectedEntries, from, preservesKey, to }) =>
    Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const navigation = yield* Navigation;
          const initial = yield* navigation.currentEntry;
          const destination = yield* navigation.navigate(to, { history: "auto" });
          const entries = yield* navigation.entries;

          assert.equal(entries.length, expectedEntries);
          assert.equal(destination.url.href, to);
          assert.equal(destination.key === initial.key, preservesKey);
        }),
        initialMemory({ url: from, origin: "https://example.com" }).pipe(Layer.provide(IdsTest())),
      ),
    ),
  );
});
