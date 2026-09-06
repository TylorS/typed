import { describe, expect, it } from "vitest";
import {
  CouldNotFindCommentError,
  CouldNotFindManyCommentError,
  CouldNotFindRootElement,
  CouldNotFindTemplateEndError,
  CouldNotFindTemplateHashError,
  isHydrationError,
} from "../errors.js";

describe("errors", () => {
  it.each([
    new CouldNotFindCommentError(0),
    new CouldNotFindRootElement(1),
    new CouldNotFindManyCommentError("key"),
    new CouldNotFindTemplateHashError("hash"),
    new CouldNotFindTemplateEndError("hash"),
  ])("identifies hydration errors", (error) => {
    expect(isHydrationError(error)).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it("rejects non-hydration errors", () => {
    expect(isHydrationError(new Error("other"))).toBe(false);
    expect(isHydrationError(null)).toBe(false);
  });
});
