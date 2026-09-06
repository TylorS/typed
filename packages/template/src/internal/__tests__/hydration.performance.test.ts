import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import {
  findHydrationHole,
  getChildNodes,
  getHydrationRoot,
  getNodes,
  getNodesExcludingStartComment,
} from "../hydration.js";

describe("hydration traversal", () => {
  it("inspects each marker once while parsing nested marker ranges", () => {
    const window = new Window();
    const document = window.document as unknown as Document;
    const root = document.createElement("main") as HTMLElement;
    const fragment = document.createDocumentFragment();
    const depth = 400;
    let inspections = 0;

    for (let index = 0; index < depth; index++) {
      fragment.append(instrumentComment(document, `t_hash-${index}`, () => inspections++));
    }
    const text = document.createTextNode("value");
    fragment.append(text);
    for (let index = depth - 1; index >= 0; index--) {
      fragment.append(instrumentComment(document, `/t_hash-${index}`, () => inspections++));
    }
    root.append(fragment);

    inspections = 0;
    const hydration = getHydrationRoot(root);

    assert.strictEqual(inspections, depth * 2);
    assert.deepEqual(getNodes(hydration.childNodes[0]), [text]);
  });

  it("parses, searches, and flattens a deeply nested real DOM without using the call stack", () => {
    const window = new Window();
    const document = window.document as unknown as Document;
    const root = document.createElement("main") as HTMLElement;
    const depth = 12_000;
    let parent: Element = root;

    for (let index = 0; index < depth; index++) {
      const child = document.createElement("div");
      parent.appendChild(child);
      parent = child;
    }

    const start = document.createComment("n_7");
    const text = document.createTextNode("value");
    const end = document.createComment("/n_7");
    parent.append(start, text, end);

    const hydration = getHydrationRoot(root);
    const hole = findHydrationHole(getChildNodes(hydration), 7);

    assert(hole);
    assert.deepEqual(getNodes(hole), [start, text, end]);
    assert.deepEqual(getNodesExcludingStartComment(hole), [text, end]);
  });

  it("flattens deeply nested template markers without using the call stack", () => {
    const window = new Window();
    const document = window.document as unknown as Document;
    const root = document.createElement("main") as HTMLElement;
    const fragment = document.createDocumentFragment();
    const depth = 12_000;

    for (let index = 0; index < depth; index++) {
      fragment.append(document.createComment(`t_hash-${index}`));
    }
    const text = document.createTextNode("value");
    fragment.append(text);
    for (let index = depth - 1; index >= 0; index--) {
      fragment.append(document.createComment(`/t_hash-${index}`));
    }
    root.append(fragment);

    const hydration = getHydrationRoot(root);

    assert.deepEqual(getNodes(hydration.childNodes[0]), [text]);
    assert.deepEqual(getNodesExcludingStartComment(hydration.childNodes[0]), [text]);
  });
});

function instrumentComment(document: Document, marker: string, onRead: () => void): Comment {
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
