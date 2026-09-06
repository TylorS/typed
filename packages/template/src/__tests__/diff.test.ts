import { expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { diff, insertOrMoveBefore } from "../internal/diff.js";

it("reconciles every ordered subset of four keys without removing retained entries", () => {
  const document = new Window().document as unknown as Document;
  const orders = subsets([0, 1, 2, 3]);
  for (const previous of orders) {
    for (const next of orders) {
      const parent = document.createElement("div");
      const before = document.createComment("before");
      const after = document.createComment("after");
      const nodes = Array.from({ length: 4 }, (_, key) => {
        const node = document.createElement("span");
        node.textContent = String(key);
        return node;
      });
      parent.append(before, ...previous.map((key) => nodes[key]), after);
      const removed: Array<number> = [];
      diff(
        Object.freeze([...previous]),
        [...next],
        {
          first: (key) => nodes[key],
          last: (key) => nodes[key],
          insert: (key, anchor) => {
            parent.insertBefore(nodes[key], anchor);
          },
          remove: (key) => {
            removed.push(key);
            nodes[key].remove();
          },
        },
        after,
      );
      const expected = [before, ...next.map((key) => nodes[key]), after];
      expect(parent.childNodes.length).toBe(expected.length);
      for (let index = 0; index < expected.length; index++)
        expect(parent.childNodes[index]).toBe(expected[index]);
      expect(Array.from(parent.children, (node) => node.textContent)).toEqual(next.map(String));
      expect(removed.sort((a, b) => a - b)).toEqual(
        previous.filter((key) => !next.includes(key)).sort((a, b) => a - b),
      );
    }
  }
});

it.each([1, 1000, 10000])("performs no DOM operations for %s unchanged entries", (size) => {
  const document = new Window().document as unknown as Document;
  const keys = Array.from({ length: size }, (_, key) => key);
  const unexpected = vi.fn(() => {
    throw new Error("Unchanged entries must not touch DOM");
  });
  diff(
    keys,
    [...keys],
    { first: unexpected, last: unexpected, insert: unexpected, remove: unexpected },
    document.createComment("end"),
  );
  expect(unexpected).not.toHaveBeenCalled();
});

it.each(["left", "right"])("rotates 1000 entries %s with one move", (direction) => {
  const document = new Window().document as unknown as Document;
  const parent = document.createElement("div");
  const nodes = Array.from({ length: 1000 }, () => document.createElement("span"));
  const end = document.createComment("end");
  parent.append(...nodes, end);
  const next =
    direction === "left"
      ? [...nodes.slice(1), nodes[0]]
      : [nodes[nodes.length - 1], ...nodes.slice(0, -1)];
  const insert = vi.fn((node: Node, before: Node | null) => parent.insertBefore(node, before));
  const remove = vi.fn();
  diff(nodes, next, { first: (node) => node, last: (node) => node, insert, remove }, end);
  expect(insert).toHaveBeenCalledTimes(1);
  expect(remove).not.toHaveBeenCalled();
  for (let index = 0; index < next.length; index++)
    expect(parent.childNodes[index]).toBe(next[index]);
});

it.each(["missing", "throws", "supported"])("moves nodes when moveBefore is %s", (mode) => {
  const document = new Window().document as unknown as Document;
  const parent = document.createElement("div");
  const first = document.createElement("span");
  const second = document.createElement("span");
  parent.append(first, second);
  const move = vi.fn((node: Node, before: Node | null) => {
    if (mode === "throws") throw new Error("unsupported move");
    parent.insertBefore(node, before);
  });
  Object.defineProperty(parent, "moveBefore", { value: mode === "missing" ? undefined : move });
  insertOrMoveBefore(parent, second, first);
  expect(parent.firstChild).toBe(second);
  expect(parent.lastChild).toBe(first);
  expect(move).toHaveBeenCalledTimes(mode === "missing" ? 0 : 1);
  // Already positioned nodes and self-anchors must not invoke platform moves.
  move.mockClear();
  insertOrMoveBefore(parent, second, first);
  insertOrMoveBefore(parent, first, first);
  insertOrMoveBefore(parent, first, null);
  expect(move).not.toHaveBeenCalled();
});

function subsets(keys: Array<number>): Array<Array<number>> {
  return [
    [],
    ...keys.flatMap((key) =>
      subsets(keys.filter((candidate) => candidate !== key)).map((tail) => [key, ...tail]),
    ),
  ];
}
