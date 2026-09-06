import * as Effect from "effect/Effect";
import * as FastCheck from "effect/testing/FastCheck";
import { describe, expect, it } from "vitest";
import * as Cuid from "../Cuid.js";
import { Ids } from "../Ids.js";
import { IdsTest } from "../IdsTest.js";
import * as Ksuid from "../Ksuid.js";
import * as NanoId from "../NanoId.js";
import * as Ulid from "../Ulid.js";
import * as Uuid4 from "../Uuid4.js";
import * as Uuid5 from "../Uuid5.js";
import * as Uuid7 from "../Uuid7.js";

const run = <A, E>(effect: Effect.Effect<A, E, Ids>) =>
  Effect.runPromise(Effect.provide(effect, IdsTest()));

describe("@typed/id", () => {
  describe("type guards (property-based)", () => {
    describe("isUuid4", () => {
      it("accepts any UUID v4", () => {
        FastCheck.assert(
          FastCheck.property(FastCheck.uuid({ version: 4 }), (s) => Uuid4.isUuid4(s)),
        );
      });
      it("rejects non-UUID-v4 strings", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string({ maxLength: 35 }).filter((s) => s.length < 36),
          FastCheck.string().filter(
            (s) =>
              !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s),
          ),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Uuid4.isUuid4(s)));
      });
    });

    describe("isUuid5", () => {
      it("accepts any UUID v5", () => {
        FastCheck.assert(
          FastCheck.property(FastCheck.uuid({ version: 5 }), (s) => Uuid5.isUuid5(s)),
        );
      });
      it("rejects non-UUID-v5 strings", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string().filter(
            (s) =>
              !/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s),
          ),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Uuid5.isUuid5(s)));
      });
    });

    describe("isUuid7", () => {
      it("accepts any UUID v7", () => {
        FastCheck.assert(
          FastCheck.property(FastCheck.uuid({ version: 7 }), (s) => Uuid7.isUuid7(s)),
        );
      });
      it("rejects non-UUID-v7 strings", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string().filter(
            (s) =>
              !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s),
          ),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Uuid7.isUuid7(s)));
      });
    });

    describe("isCuid", () => {
      it("accepts any generator-shaped CUID", () => {
        const cuidArb = FastCheck.stringMatching(/^[a-z][0-9a-z]{23}$/);
        FastCheck.assert(FastCheck.property(cuidArb, (s) => Cuid.isCuid(s)));
      });
      it("rejects strings the generator cannot emit", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.constant("a0"),
          FastCheck.constant(`a${"0".repeat(24)}`),
          FastCheck.string().filter((s) => !/^[a-z][0-9a-z]{23}$/.test(s)),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Cuid.isCuid(s)));
      });
    });

    describe("isKsuid", () => {
      it("accepts any 27-char base62 string", () => {
        const ksuidArb = FastCheck.stringMatching(/^[0-9A-Za-z]{27}$/);
        FastCheck.assert(FastCheck.property(ksuidArb, (s) => Ksuid.isKsuid(s)));
      });
      it("rejects non-KSUID strings", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string().filter((s) => s.length !== 27 || !/^[0-9A-Za-z]{27}$/.test(s)),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Ksuid.isKsuid(s)));
      });
    });

    describe("isNanoId", () => {
      it("accepts any string with only 0-9a-zA-Z_-", () => {
        const nanoIdArb = FastCheck.stringMatching(/^[0-9a-zA-Z_-]+$/);
        FastCheck.assert(FastCheck.property(nanoIdArb, (s) => NanoId.isNanoId(s)));
      });
      it("rejects strings with invalid characters", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string().filter((s) => !/^[0-9a-zA-Z_-]+$/.test(s)),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !NanoId.isNanoId(s)));
      });
    });

    describe("isUlid", () => {
      it("accepts any valid ULID", () => {
        FastCheck.assert(FastCheck.property(FastCheck.ulid(), (s) => Ulid.isUlid(s)));
      });
      it("rejects non-ULID strings", () => {
        const invalid = FastCheck.oneof(
          FastCheck.constant(""),
          FastCheck.string().filter(
            (s) => s.length !== 26 || !/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/.test(s),
          ),
        );
        FastCheck.assert(FastCheck.property(invalid, (s) => !Ulid.isUlid(s)));
      });
    });
  });

  describe("Ids service", () => {
    it("uuid5 produces valid UUID v5", async () => {
      const id = await run(Ids.uuid5("hello", Uuid5.Uuid5Namespace.DNS));
      expect(Uuid5.isUuid5(id)).toBe(true);
    });

    it("uuid5 is deterministic for same name and namespace", async () => {
      const a = await run(Ids.uuid5("test", Uuid5.Uuid5Namespace.URL));
      const b = await run(Ids.uuid5("test", Uuid5.Uuid5Namespace.URL));
      expect(a).toBe(b);
    });

    it("uuid5 differs for different names", async () => {
      const a = await run(Ids.uuid5("a", Uuid5.Uuid5Namespace.DNS));
      const b = await run(Ids.uuid5("b", Uuid5.Uuid5Namespace.DNS));
      expect(a).not.toBe(b);
    });

    it("uuid5 predefined namespaces work", async () => {
      const dns = await run(Ids.uuid5.dns("example.com"));
      const url = await run(Ids.uuid5.url("https://example.com"));
      const oid = await run(Ids.uuid5.oid("1.2.3"));
      const x500 = await run(Ids.uuid5.x500("cn=test"));
      expect(Uuid5.isUuid5(dns)).toBe(true);
      expect(Uuid5.isUuid5(url)).toBe(true);
      expect(Uuid5.isUuid5(oid)).toBe(true);
      expect(Uuid5.isUuid5(x500)).toBe(true);
      expect(new Set([dns, url, oid, x500]).size).toBe(4);
    });
  });

  describe("Ids.Default", () => {
    it("runs all generators with default layer", async () => {
      const program = Effect.gen(function* () {
        const ids = yield* Ids;
        const u4 = yield* ids.uuid4;
        const u5 = yield* ids.uuid5("default-test", Uuid5.Uuid5Namespace.DNS);
        const u7 = yield* ids.uuid7;
        const c = yield* ids.cuid;
        const k = yield* ids.ksuid;
        const n = yield* ids.nanoId;
        const u = yield* ids.ulid;
        return { u4, u5, u7, c, k, n, u };
      });
      const result = await Effect.runPromise(Effect.provide(program, Ids.Default));
      expect(Uuid4.isUuid4(result.u4)).toBe(true);
      expect(Uuid5.isUuid5(result.u5)).toBe(true);
      expect(Uuid7.isUuid7(result.u7)).toBe(true);
      expect(Cuid.isCuid(result.c)).toBe(true);
      expect(Ksuid.isKsuid(result.k)).toBe(true);
      expect(result.k).toHaveLength(27);
      expect(NanoId.isNanoId(result.n)).toBe(true);
      expect(result.n).toHaveLength(21);
      expect(Ulid.isUlid(result.u)).toBe(true);
      expect(result.u).toHaveLength(26);
    });
  });

  describe("IdsTest", () => {
    it("runs all generators with the test layer", async () => {
      const program = Effect.gen(function* () {
        const ids = yield* Ids;
        const u4 = yield* ids.uuid4;
        const u5 = yield* ids.uuid5("test-layer", Uuid5.Uuid5Namespace.DNS);
        const u7 = yield* ids.uuid7;
        const c = yield* ids.cuid;
        const k = yield* ids.ksuid;
        const n = yield* ids.nanoId;
        const u = yield* ids.ulid;
        return { u4, u5, u7, c, k, n, u };
      });
      const result = await run(program);
      expect(Uuid4.isUuid4(result.u4)).toBe(true);
      expect(Uuid5.isUuid5(result.u5)).toBe(true);
      expect(Uuid7.isUuid7(result.u7)).toBe(true);
      expect(Cuid.isCuid(result.c)).toBe(true);
      expect(Ksuid.isKsuid(result.k)).toBe(true);
      expect(result.k).toHaveLength(27);
      expect(NanoId.isNanoId(result.n)).toBe(true);
      expect(result.n).toHaveLength(21);
      expect(Ulid.isUlid(result.u)).toBe(true);
      expect(result.u).toHaveLength(26);
    });
  });
});
