import { assert, describe, it } from "vitest";
import { findHydrationHole, getChildNodes, getHydrationRoot, getNodes } from "../hydration.js";

describe("hydration traversal in Chromium", () => {
  it("parses and searches a deeply nested real DOM without overflowing the call stack", () => {
    const root = document.createElement("main");
    const depth = 12_000;
    let parent: Element = root;

    for (let index = 0; index < depth; index++) {
      const child = document.createElement("div");
      parent.appendChild(child);
      parent = child;
    }

    const start = document.createComment("n_9");
    const text = document.createTextNode("value");
    const end = document.createComment("/n_9");
    parent.append(start, text, end);

    const hydration = getHydrationRoot(root);
    const hole = findHydrationHole(getChildNodes(hydration), 9);

    assert(hole);
    assert.deepEqual(getNodes(hole), [start, text, end]);
  }, 20_000);

  it("inspects each nested marker once", () => {
    const root = document.createElement("main");
    const fragment = document.createDocumentFragment();
    const depth = 8_000;
    let inspections = 0;

    for (let index = 0; index < depth; index++) {
      fragment.append(instrumentComment(`t_hash-${index}`, () => inspections++));
    }
    fragment.append(document.createTextNode("value"));
    for (let index = depth - 1; index >= 0; index--) {
      fragment.append(instrumentComment(`/t_hash-${index}`, () => inspections++));
    }
    root.append(fragment);

    inspections = 0;
    const hydration = getHydrationRoot(root);

    assert.strictEqual(inspections, depth * 2);
    assert.deepEqual(getNodes(hydration.childNodes[0]), [root.childNodes[depth]]);
  }, 20_000);
});

function instrumentComment(marker: string, onRead: () => void): Comment {
  const comment = document.createComment(marker);
  Object.defineProperty(comment, "data", {
    configurable: true,
    get() {
      onRead();
      return marker;
    },
  });
  return comment;
}
