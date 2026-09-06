import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import { dnsUuid5, uuid5, Uuid5Namespace } from "../Uuid5.js";

const expectedDnsUuid = "2ed6657d-e927-568b-95e1-2665a8aea6a2";

describe("Uuid5", () => {
  it("keeps the standard DNS namespace canonical after callers mutate returned bytes", async () => {
    const namespace = Uuid5Namespace.DNS;
    const original = namespace.slice(0);

    try {
      namespace.fill(0);

      expect(await Effect.runPromise(uuid5("www.example.com", Uuid5Namespace.DNS))).toBe(
        expectedDnsUuid,
      );
      expect(await Effect.runPromise(dnsUuid5("www.example.com"))).toBe(expectedDnsUuid);
    } finally {
      namespace.set(original);
    }
  });

  it("keeps the standard DNS namespace canonical after property replacement", async () => {
    const namespaces = Uuid5Namespace as unknown as Record<string, Uint8Array>;
    const original = Uuid5Namespace.DNS;

    try {
      Reflect.set(namespaces, "DNS", new Uint8Array(16));

      expect(await Effect.runPromise(uuid5("www.example.com", Uuid5Namespace.DNS))).toBe(
        expectedDnsUuid,
      );
    } finally {
      Reflect.set(namespaces, "DNS", original);
    }
  });

  it.each([0, 15, 17])("rejects a %i-byte namespace through its error channel", async (length) => {
    const exit = await Effect.runPromise(
      Effect.exit(uuid5("www.example.com", new Uint8Array(length))),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const failure = Cause.findErrorOption(exit.cause);
      expect(failure._tag).toBe("Some");
      if (failure._tag === "Some") {
        expect(Cause.isIllegalArgumentError(failure.value)).toBe(true);
      }
    }
  });
});
