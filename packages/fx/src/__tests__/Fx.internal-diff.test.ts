import { describe, expect, it } from "vitest";
import { getKeyMap } from "../Fx/internal/diff.js";

describe("Fx internal diff key maps", () => {
  it("derives keys with the key function from the current call", () => {
    const values = [
      { id: "a", group: "x" },
      { id: "b", group: "y" },
    ];

    expect([...getKeyMap(values, (value) => value.id)]).toEqual([
      ["a", 0],
      ["b", 1],
    ]);
    expect([...getKeyMap(values, (value) => value.group)]).toEqual([
      ["x", 0],
      ["y", 1],
    ]);
  });

  it("derives keys from the array's current contents", () => {
    const values = [{ id: "a" }];

    expect([...getKeyMap(values, (value) => value.id)]).toEqual([["a", 0]]);
    values[0] = { id: "b" };
    expect([...getKeyMap(values, (value) => value.id)]).toEqual([["b", 0]]);
  });
});
