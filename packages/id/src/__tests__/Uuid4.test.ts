import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { isUuid4, uuid4 } from "../Uuid4.js";
import { zeroRandomValues } from "./helpers.js";

describe("uuid4", () => {
  it("sets the version and variant bits on the random seed", async () => {
    const id = await Effect.runPromise(Effect.provide(uuid4, zeroRandomValues));

    expect(id).toBe("00000000-0000-4000-8000-000000000000");
    expect(isUuid4(id)).toBe(true);
  });
});
