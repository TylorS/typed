import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { isNanoId, nanoId } from "../NanoId.js";
import { RandomValues } from "../RandomValues.js";
import { zeroRandomValues } from "./helpers.js";

describe("nanoId", () => {
  it("maps zero entropy to the default alphabet and fixed length", async () => {
    const id = await Effect.runPromise(Effect.provide(nanoId, zeroRandomValues));

    expect(id).toBe("000000000000000000000");
    expect(id).toHaveLength(21);
    expect(isNanoId(id)).toBe(true);
  });

  it("maps every supported alphabet bucket", async () => {
    const bytes = Uint8Array.from({ length: 21 }, (_, index) => index);
    const customLayer = Layer.succeed(
      RandomValues,
      RandomValues.of(
        Effect.fn(<const N extends number>(length: N) =>
          Effect.succeed(bytes.slice(0, length) as Uint8Array & { readonly length: N }),
        ),
      ),
    );

    const id = await Effect.runPromise(Effect.provide(nanoId, customLayer));

    expect(id).toBe("0123456789abcdefghijk");
    expect(isNanoId(id)).toBe(true);
  });

  it("maps underscore and hyphen buckets", async () => {
    const bytes = Uint8Array.from([
      36, 61, 62, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const customLayer = Layer.succeed(
      RandomValues,
      RandomValues.of(
        Effect.fn(<const N extends number>(length: N) =>
          Effect.succeed(bytes.slice(0, length) as Uint8Array & { readonly length: N }),
        ),
      ),
    );

    const id = await Effect.runPromise(Effect.provide(nanoId, customLayer));

    expect(id.startsWith("AZ_-")).toBe(true);
    expect(isNanoId(id)).toBe(true);
  });
});
